import { Role, RolePermission, Permission } from '../../domain/entities'

export class RoleMapper {
  static toDomainRole(prismaRole: any): Role | null {
    if (!prismaRole) return null

    const rolePermissions = prismaRole.rolePermissions
      ? prismaRole.rolePermissions.map((rp: any) =>
          RolePermissionMapper.toDomainRolePermission(rp),
        )
      : undefined

    return new Role(
      prismaRole.roleId,
      prismaRole.roleName,
      prismaRole.description ?? undefined,
      prismaRole.isAssignable,
      prismaRole.createdAt,
      rolePermissions,
    )
  }

  static toDomainRoles(prismaRoles: any[]): Role[] {
    return prismaRoles.map((role) => this.toDomainRole(role)).filter(Boolean) as Role[]
  }
}

export class PermissionMapper {
  static toDomainPermission(prismaPermission: any): Permission | null {
    if (!prismaPermission) return null

    return new Permission(
      prismaPermission.permissionId,
      prismaPermission.code,
      prismaPermission.name,
      prismaPermission.description ?? undefined,
      prismaPermission.group ?? undefined,
      prismaPermission.isSystem,
      prismaPermission.createdAt,
    )
  }

  static toDomainPermissions(prismaPermissions: any[]): Permission[] {
    return prismaPermissions
      .map((permission) => this.toDomainPermission(permission))
      .filter(Boolean) as Permission[]
  }
}

export class RolePermissionMapper {
  static toDomainRolePermission(prismaRolePermission: any): RolePermission | null {
    if (!prismaRolePermission) return null

    const role = prismaRolePermission.role
      ? RoleMapper.toDomainRole(prismaRolePermission.role)
      : undefined

    const permission = prismaRolePermission.permission
      ? PermissionMapper.toDomainPermission(prismaRolePermission.permission)
      : undefined

    return new RolePermission(
      prismaRolePermission.roleId,
      prismaRolePermission.permissionId,
      role ?? undefined,
      permission ?? undefined,
    )
  }

  static toDomainRolePermissions(prismaRolePermissions: any[]): RolePermission[] {
    return prismaRolePermissions
      .map((rp) => this.toDomainRolePermission(rp))
      .filter(Boolean) as RolePermission[]
  }
}
