import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { getRollbackAction } from '../../../shared/constants/action-key.constants'
import { isReversibleAction } from '../../../shared/constants/action-key.constants'
import { getRepositoryName, getResourceInfo } from 'src/shared/constants/resource-type.constants'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ConflictException, BusinessLogicException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class RollbackUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(logId: number): Promise<BaseResponseDto<boolean>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const logRepository = repos.adminAuditLogRepository

      // 1. Tìm log cần rollback
      const log = await logRepository.findById(logId)
      if (!log) {
        throw new NotFoundException('Không tìm thấy log')
      }
      if (log.status === AuditStatus.ROLLBACK) {
        throw new ConflictException('Log đã được rollback')
      }
      if (log.status === AuditStatus.FAIL) {
        throw new ConflictException('Log thất bại, không thể rollback')
      }

      // 2. Kiểm tra action có reversible không
      if (!isReversibleAction(log.actionKey)) {
        throw new BusinessLogicException('Không thể rollback hành động này')
      }

      // 3. Update trạng thái của log hiện tại thành rollback
      await logRepository.updateStatus(log.logId, AuditStatus.ROLLBACK)

      // 4. Xác định repository và kiểm tra tính hợp lệ
      const resourceInfo = getResourceInfo(log.resourceType as any)
      if (!resourceInfo) {
        throw new BusinessLogicException('Resource type không hợp lệ')
      }

      const repositoryName = resourceInfo.repositoryName
      const repository = repos[repositoryName]
      if (!repository) {
        throw new NotFoundException(`Không tìm thấy repository: ${repositoryName}`)
      }

      // 5. Parse dữ liệu từ JSON nếu cần
      let beforeData = log.beforeData
      if (typeof beforeData === 'string') {
        try {
          beforeData = JSON.parse(beforeData)
        } catch (error) {
          throw new BusinessLogicException('Dữ liệu log không hợp lệ')
        }
      }

      // 6. Thực hiện rollback action
      const reverseAction = getRollbackAction(log.actionKey)

      try {
        if (
          reverseAction === ACTION_KEYS.ROLE.DELETE ||
          reverseAction === ACTION_KEYS.USER.DELETE ||
          reverseAction === ACTION_KEYS.DOCUMENT.DELETE
        ) {
          // CREATE -> DELETE: Xóa record đã tạo
          await (repository as any).delete(log.resourceId)
        } else if (
          reverseAction === ACTION_KEYS.ROLE.CREATE ||
          reverseAction === ACTION_KEYS.USER.CREATE ||
          reverseAction === ACTION_KEYS.DOCUMENT.CREATE
        ) {
          // DELETE -> CREATE: Tạo lại record đã xóa
          if (!beforeData) {
            throw new BusinessLogicException('Không có dữ liệu để khôi phục')
          }
          await (repository as any).create(beforeData)
        } else if (
          reverseAction === ACTION_KEYS.ROLE.UPDATE ||
          reverseAction === ACTION_KEYS.USER.UPDATE ||
          reverseAction === ACTION_KEYS.DOCUMENT.UPDATE
        ) {
          // UPDATE -> UPDATE: Khôi phục về trạng thái trước
          if (!beforeData) {
            throw new BusinessLogicException('Không có dữ liệu để khôi phục')
          }
          await (repository as any).update(log.resourceId, beforeData)
        } else {
          throw new BusinessLogicException(`Không hỗ trợ rollback cho action: ${reverseAction}`)
        }
        return {
          success: true,
          message: 'Rollback thành công',
          data: true,
        }
      } catch (error) {
        console.error('Rollback operation failed:', error)
        throw new BusinessLogicException(`Rollback thất bại`)
      }
    })
    return result
  }
}
