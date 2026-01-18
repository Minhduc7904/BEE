import { Role, RolePermission, Permission } from '../../../domain/entities'

export class RoleMapper {
  static toDomainRole(prismaRole: any): Role | null {
    if (!prismaRole) return null

    const rolePermissions = prismaRole.rolePermissions
      ? prismaRole.rolePermissions.map((rp: any) =>
          RolePermissionMapper.toDomainRolePermission(rp),
        )
      : undefined

    return new Role({
      roleId: prismaRole.roleId,
      roleName: prismaRole.roleName,
      isAssignable: prismaRole.isAssignable,
      createdAt: prismaRole.createdAt,
      description: prismaRole.description ?? undefined,
      rolePermissions,
    })
  }

  static toDomainRoles(prismaRoles: any[]): Role[] {
    return prismaRoles.map((role) => this.toDomainRole(role)).filter(Boolean) as Role[]
  }
}

export class PermissionMapper {
  static toDomainPermission(prismaPermission: any): Permission | null {
    if (!prismaPermission) return null

    return new Permission({
      permissionId: prismaPermission.permissionId,
      code: prismaPermission.code,
      name: prismaPermission.name,
      isSystem: prismaPermission.isSystem,
      createdAt: prismaPermission.createdAt,
      description: prismaPermission.description ?? undefined,
      group: prismaPermission.group ?? undefined,
    })
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

    return new RolePermission({
      roleId: prismaRolePermission.roleId,
      permissionId: prismaRolePermission.permissionId,
      role: role ?? undefined,
      permission: permission ?? undefined,
    })
  }

  static toDomainRolePermissions(prismaRolePermissions: any[]): RolePermission[] {
    return prismaRolePermissions
      .map((rp) => this.toDomainRolePermission(rp))
      .filter(Boolean) as RolePermission[]
  }
}
