import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class ToggleRolePermissionUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
        roleId: number,
        permissionId: number,
        adminId: number,
    ): Promise<BaseResponseDto<{ action: 'added' | 'removed'; roleId: number; permissionId: number }>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const roleRepository = repos.roleRepository
            const permissionRepository = repos.permissionRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            // Kiểm tra role có tồn tại không
            const role = await roleRepository.findById(roleId)
            if (!role) {
                await adminAuditLogRepository.create({
                    adminId: adminId,
                    actionKey: ACTION_KEYS.ROLE.TOGGLE_PERMISSION,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.ROLE,
                    resourceId: roleId.toString(),
                    errorMessage: 'Role not found',
                })
                throw new NotFoundException('Role not found')
            }

            // Kiểm tra permission có tồn tại không
            const permission = await permissionRepository.findById(permissionId)
            if (!permission) {
                await adminAuditLogRepository.create({
                    adminId: adminId,
                    actionKey: ACTION_KEYS.ROLE.TOGGLE_PERMISSION,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.ROLE,
                    resourceId: roleId.toString(),
                    errorMessage: 'Permission not found',
                })
                throw new NotFoundException('Permission not found')
            }

            // Check if permission already exists in role
            const hasPermission = await roleRepository.hasPermission(roleId, permissionId)

            let action: 'added' | 'removed'

            if (hasPermission) {
                // Remove permission from role
                await roleRepository.removePermission(roleId, permissionId)
                action = 'removed'
            } else {
                // Add permission to role
                await roleRepository.addPermission(roleId, permissionId)
                action = 'added'
            }

            // Log audit
            await adminAuditLogRepository.create({
                adminId: adminId,
                actionKey: ACTION_KEYS.ROLE.TOGGLE_PERMISSION,
                status: AuditStatus.SUCCESS,
                resourceType: RESOURCE_TYPES.ROLE,
                resourceId: roleId.toString(),
                afterData: {
                    action,
                    roleId,
                    roleName: role.roleName,
                    permissionId,
                    permissionCode: permission.code,
                    permissionName: permission.name,
                },
            })

            return { action, roleId, permissionId }
        })

        return BaseResponseDto.success(
            result.action === 'added'
                ? 'Permission added to role successfully'
                : 'Permission removed from role successfully',
            result,
        )
    }
}
