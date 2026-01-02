import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class DeleteRoleUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(roleId: number, adminId: number): Promise<BaseResponseDto<{ deleted: boolean }>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const roleRepository = repos.roleRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra role có tồn tại không
      const existingRole = await roleRepository.findById(roleId)
      if (!existingRole) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.ROLE.DELETE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.ROLE,
          resourceId: roleId.toString(),
          errorMessage: 'Role not found',
        })
        throw new NotFoundException('Role not found')
      }

      // Xóa role
      await roleRepository.delete(roleId)

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.ROLE.DELETE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.ROLE,
        resourceId: roleId.toString(),
        beforeData: {
          roleName: existingRole.roleName,
          description: existingRole.description,
        },
      })

      return { deleted: true }
    })

    return BaseResponseDto.success('Delete role successfully', result)
  }
}
