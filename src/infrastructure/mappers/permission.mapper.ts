// src/infrastructure/mappers/permission.mapper.ts
import { Permission } from '../../domain/entities/role/permission.entity'

export class PermissionMapper {
  static toDomainPermission(prismaPermission: any): Permission | null {
    if (!prismaPermission) return null

    return new Permission(
      prismaPermission.permissionId,
      prismaPermission.code,
      prismaPermission.name,
      prismaPermission.description,
      prismaPermission.group,
      prismaPermission.isSystem,
      prismaPermission.createdAt,
      prismaPermission.rolePermissions,
    )
  }

  static toDomainPermissions(prismaPermissions: any[]): Permission[] {
    return prismaPermissions
      .map((p) => PermissionMapper.toDomainPermission(p))
      .filter((p): p is Permission => p !== null)
  }
}
