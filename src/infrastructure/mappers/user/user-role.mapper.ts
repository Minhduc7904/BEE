// src/infrastructure/mappers/user-role.mapper.ts

import { UserRole } from '../../../domain/entities'
import { RoleMapper, UserMapper } from '..'

export class UserRoleMapper {
  static toDomainUserRole(prismaUserRole: any): UserRole | null {
    if (!prismaUserRole) return null

    return new UserRole({
      userId: prismaUserRole.userId,
      roleId: prismaUserRole.roleId,
      assignedAt: prismaUserRole.assignedAt,
      expiresAt: prismaUserRole.expiresAt,
      assignedBy: prismaUserRole.assignedBy,
      isActive: prismaUserRole.isActive,
      role: RoleMapper.toDomainRole(prismaUserRole.role) || undefined,
      user: UserMapper.toDomainUser(prismaUserRole.user) || undefined,
      assignedByUser: UserMapper.toDomainUser(prismaUserRole.assignedByUser) || undefined,
    })
  }
  static toDomainUserRoles(prismaUserRoles: any[]): UserRole[] {
    return prismaUserRoles.map((userRole) => this.toDomainUserRole(userRole)).filter(Boolean) as UserRole[]
  }
}
