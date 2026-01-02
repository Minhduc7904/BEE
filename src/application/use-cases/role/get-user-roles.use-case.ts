import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, UserRoleWithPermissionsResponseDto, RoleWithPermissionsResponseDto, PermissionResponseDto } from '../../dtos'
import type { IRoleRepository } from '../../../domain/repositories'

@Injectable()
export class GetUserRolesUseCase {
  constructor(@Inject('IRoleRepository') private readonly roleRepository: IRoleRepository) {}

  async execute(userId: number): Promise<BaseResponseDto<UserRoleWithPermissionsResponseDto[]>> {
    const userRoles = await this.roleRepository.getUserRoles(userId)

    const response = userRoles.map<UserRoleWithPermissionsResponseDto>((ur) => {
      const role = ur.role ? RoleWithPermissionsResponseDto.fromRoleWithPermissions(ur.role) : undefined
      const permissions =
        ur.role?.rolePermissions
          ?.map((rp) => (rp.permission ? PermissionResponseDto.fromPermission(rp.permission) : null))
          .filter((permission): permission is PermissionResponseDto => Boolean(permission)) ?? []

      return {
        userId: ur.userId,
        roleId: ur.roleId,
        assignedAt: ur.assignedAt,
        expiresAt: ur.expiresAt,
        assignedBy: ur.assignedBy,
        isActive: ur.isActive,
        role,
        permissions,
      }
    })

    return BaseResponseDto.success('Get user roles successfully', response)
  }
}
