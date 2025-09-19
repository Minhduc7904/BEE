import { Role } from '../../domain/entities/role/role.entity'

export class RoleMapper {
  static toDomainRole(prismaRole: any): Role | null {
    if (!prismaRole) return null

    return new Role(
      prismaRole.roleId,
      prismaRole.roleName,
      prismaRole.description ?? undefined,
      prismaRole.isAssignable,
      prismaRole.requiredByRoleId ?? undefined,
      prismaRole.createdAt,
    )
  }
  static toDomainRoles(prismaRoles: any[]): Role[] {
    return prismaRoles.map((role) => this.toDomainRole(role)).filter(Boolean) as Role[]
  }
}
