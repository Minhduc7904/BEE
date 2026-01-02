import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, CreateRoleDto, RoleResponseDto } from '../../dtos'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class CreateRoleUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(dto: CreateRoleDto, adminId: number): Promise<BaseResponseDto<RoleResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const roleRepository = repos.roleRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra role name đã tồn tại chưa
      const existingRole = await roleRepository.findByName(dto.roleName)
      if (existingRole) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.ROLE.CREATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.ROLE,
          errorMessage: `Role với tên '${dto.roleName}' đã tồn tại`,
        })
        throw new ConflictException(`Role với tên '${dto.roleName}' đã tồn tại`)
      }

      // Tạo role mới
      const role = await roleRepository.create({
        roleName: dto.roleName,
        description: dto.description,
        isAssignable: dto.isAssignable,
      })

      // Gán permissions nếu có
      if (dto.permissionIds && dto.permissionIds.length > 0) {
        for (const permissionId of dto.permissionIds) {
          await roleRepository.addPermission(role.roleId, permissionId)
        }
      }

      // Load lại role với permissions
      const roleWithPermissions = await roleRepository.findByIdWithPermissions(role.roleId)
      if (!roleWithPermissions) {
        throw new Error('Failed to load created role')
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
        actionKey: ACTION_KEYS.ROLE.CREATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.ROLE,
        resourceId: role.roleId.toString(),
        afterData: response,
      })

      return response
    })

    return BaseResponseDto.success('Role được tạo thành công', result)
  }
}
