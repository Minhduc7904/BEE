// src/application/use-cases/statement/delete-statement.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'

@Injectable()
export class DeleteStatementUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) { }

  async execute(statementId: number, adminId?: number): Promise<BaseResponseDto<boolean>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const statementRepository = repos.statementRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const statement = await statementRepository.findById(statementId)

      if (!statement) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.STATEMENT.DELETE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.STATEMENT,
            resourceId: statementId.toString(),
            errorMessage: 'Không tìm thấy đáp án',
          })
        }
        throw new NotFoundException('Không tìm thấy đáp án')
      }

      // Detach all media from statement
      await this.attachMediaFromContentUseCase.detachAllMediaFromEntity(
        EntityType.STATEMENT,
        statementId,
        mediaUsageRepository,
      )

      // Delete the statement
      await statementRepository.delete(statementId)

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.STATEMENT.DELETE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.STATEMENT,
          resourceId: statementId.toString(),
          beforeData: {
            questionId: statement.questionId,
            isCorrect: statement.isCorrect,
          },
        })
      }

      return true
    })

    return {
      success: true,
      message: 'Xóa đáp án thành công',
      data: result,
    }
  }
}
