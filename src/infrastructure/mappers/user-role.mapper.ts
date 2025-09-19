// src/infrastructure/mappers/user-role.mapper.ts

import { UserRole } from '../../domain/entities/role/user-role.entity'
import { RoleMapper } from './role.mapper'
import { UserMapper } from './user.mapper'

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
