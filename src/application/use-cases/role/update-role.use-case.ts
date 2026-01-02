import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, RoleResponseDto, UpdateRoleDto } from '../../dtos'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class UpdateRoleUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    roleId: number,
    dto: UpdateRoleDto,
    adminId: number,
  ): Promise<BaseResponseDto<RoleResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const roleRepository = repos.roleRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra role có tồn tại không
      const existingRole = await roleRepository.findById(roleId)
      if (!existingRole) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.ROLE.UPDATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.ROLE,
          resourceId: roleId.toString(),
          errorMessage: 'Role not found',
        })
        throw new NotFoundException('Role not found')
      }

      // Nếu update roleName, kiểm tra tên mới có bị trùng không
      if (dto.roleName && dto.roleName !== existingRole.roleName) {
        const roleWithSameName = await roleRepository.findByName(dto.roleName)
        if (roleWithSameName) {
          await adminAuditLogRepository.create({
            adminId: adminId,
            actionKey: ACTION_KEYS.ROLE.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.ROLE,
            resourceId: roleId.toString(),
            errorMessage: `Role với tên '${dto.roleName}' đã tồn tại`,
          })
          throw new ConflictException(`Role với tên '${dto.roleName}' đã tồn tại`)
        }
      }

      // Update role
      const updatedRole = await roleRepository.update(roleId, {
        roleName: dto.roleName,
        description: dto.description,
        isAssignable: dto.isAssignable,
      })

      // Cập nhật permissions nếu có
      if (dto.permissionIds !== undefined) {
        // Lấy permissions hiện tại
        const currentPermissions = existingRole.rolePermissions || []
        const currentPermissionIds = currentPermissions.map(rp => rp.permissionId)
        const newPermissionIds = dto.permissionIds

        // Xóa permissions không còn trong danh sách mới
        for (const permissionId of currentPermissionIds) {
          if (!newPermissionIds.includes(permissionId)) {
            await roleRepository.removePermission(roleId, permissionId)
          }
        }

        // Thêm permissions mới
        for (const permissionId of newPermissionIds) {
          if (!currentPermissionIds.includes(permissionId)) {
            await roleRepository.addPermission(roleId, permissionId)
          }
        }
      }

      // Load lại role với permissions
      const roleWithPermissions = await roleRepository.findByIdWithPermissions(roleId)
      if (!roleWithPermissions) {
        throw new Error('Failed to load updated role')
      }

      const response: RoleResponseDto = {
        roleId: roleWithPermissions.roleId,
        roleName: roleWithPermissions.roleName,
        description: roleWithPermissions.description,
        isAssignable: roleWithPermissions.isAssignable,
        createdAt: roleWithPermissions.createdAt,
        permissions: roleWithPermissions.permissions,
        permissionsCount: roleWithPermissions.permissions.length,
      }

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.ROLE.UPDATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.ROLE,
        resourceId: roleId.toString(),
        beforeData: {
          roleName: existingRole.roleName,
          description: existingRole.description,
        },
        afterData: {
          roleName: updatedRole.roleName,
          description: updatedRole.description,
        },
      })

      return response
    })

    return BaseResponseDto.success('Update role successfully', result)
  }
}
