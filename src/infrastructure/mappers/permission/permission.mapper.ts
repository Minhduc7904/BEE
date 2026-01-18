// src/infrastructure/mappers/permission.mapper.ts
import { Permission } from '../../../domain/entities/role/permission.entity'

export class PermissionMapper {
  static toDomainPermission(prismaPermission: any): Permission | null {
    if (!prismaPermission) return null

    return new Permission({
      permissionId: prismaPermission.permissionId,
      code: prismaPermission.code,
      name: prismaPermission.name,
      isSystem: prismaPermission.isSystem,
      createdAt: prismaPermission.createdAt,
      description: prismaPermission.description,
      group: prismaPermission.group,
      rolePermissions: prismaPermission.rolePermissions,
    })
  }

  static toDomainPermissions(prismaPermissions: any[]): Permission[] {
    return prismaPermissions
      .map((p) => PermissionMapper.toDomainPermission(p))
      .filter((p): p is Permission => p !== null)
  }
}
