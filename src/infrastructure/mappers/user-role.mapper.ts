// src/infrastructure/mappers/user-role.mapper.ts

import { UserRole } from '../../domain/entities'
import { RoleMapper, UserMapper } from '../mappers'

export class UserRoleMapper {
  static toDomainUserRole(prismaUserRole: any): UserRole | null {
    if (!prismaUserRole) return null

    return new UserRole(
      prismaUserRole.userId,
      prismaUserRole.roleId,
      prismaUserRole.assignedAt,
      prismaUserRole.expiresAt,
      prismaUserRole.assignedBy,
      prismaUserRole.isActive,
      RoleMapper.toDomainRole(prismaUserRole.role) || undefined,
      UserMapper.toDomainUser(prismaUserRole.user) || undefined,
      UserMapper.toDomainUser(prismaUserRole.assignedByUser) || undefined,
    )
  }
  static toDomainUserRoles(prismaUserRoles: any[]): UserRole[] {
    return prismaUserRoles.map((userRole) => this.toDomainUserRole(userRole)).filter(Boolean) as UserRole[]
  }
}
