import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class DeletePermissionUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    permissionId: number,
    adminId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean }>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const permissionRepository = repos.permissionRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra permission có tồn tại không
      const existingPermission = await permissionRepository.findById(permissionId)
      if (!existingPermission) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.PERMISSION.DELETE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.PERMISSION,
          resourceId: permissionId.toString(),
          errorMessage: 'Permission not found',
        })
        throw new NotFoundException('Permission not found')
      }

      // Xóa permission
      await permissionRepository.delete(permissionId)

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.PERMISSION.DELETE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.PERMISSION,
        resourceId: permissionId.toString(),
        beforeData: {
          code: existingPermission.code,
          name: existingPermission.name,
          group: existingPermission.group,
        },
      })

      return { deleted: true }
    })

    return BaseResponseDto.success('Delete permission successfully', result)
  }
}
