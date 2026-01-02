import { Injectable } from '@nestjs/common'
import { UserRole, Role } from '../../domain/entities'
import {
  CreateRoleData,
  IRoleRepository,
  UpdateRoleData
} from '../../domain/repositories'
import { PrismaService } from '../../prisma/prisma.service'
import {
  RoleMapper,
  UserRoleMapper
} from '../mappers'
import { NumberUtil } from '../../shared/utils'

@Injectable()
export class PrismaRoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client

  async create(data: CreateRoleData): Promise<Role> {
    const created = await this.prisma.role.create({
      data: {
        roleName: data.roleName,
        description: data.description,
      },
    })

    return RoleMapper.toDomainRole(created)!
  }

  async findById(id: number): Promise<Role | null> {
    // Ensure id is a number
    const numericId = NumberUtil.ensureValidId(id, 'Role ID')

    const role = await this.prisma.role.findUnique({
      where: { roleId: numericId },
    })

    if (!role) return null

    return RoleMapper.toDomainRole(role)!
  }

  async findByName(name: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { roleName: name },
    })

    if (!role) return null

    return RoleMapper.toDomainRole(role)!
  }

  async findAll(limit?: number, offset?: number): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      take: limit,
      skip: offset,
    })

    return RoleMapper.toDomainRoles(roles)
  }

  async findAllWithPermissionsCount(limit?: number, offset?: number): Promise<(Role & { permissionsCount: number })[]> {
    const roles = await this.prisma.role.findMany({
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: { rolePermissions: true }
        }
      }
    })

    return roles.map(role => {
      const domainRole = RoleMapper.toDomainRole(role)!
      return Object.assign(domainRole, { permissionsCount: role._count.rolePermissions })
    })
  }

  async findByIdWithPermissions(id: number): Promise<(Role & { permissions: any[] }) | null> {
    const numericId = NumberUtil.ensureValidId(id, 'Role ID')

    const role = await this.prisma.role.findUnique({
      where: { roleId: numericId },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                permissionId: true,
                code: true,
                name: true,
                group: true
              }
            }
          }
        }
      }
    })

    if (!role) return null

    const domainRole = RoleMapper.toDomainRole(role)!
    return Object.assign(domainRole, {
      permissions: role.rolePermissions.map(rp => rp.permission)
    })
  }

  async update(id: number, data: UpdateRoleData): Promise<Role> {
    const numericId = NumberUtil.ensureValidId(id, 'Role ID')

    const updated = await this.prisma.role.update({
      where: { roleId: numericId },
      data: {
        roleName: data.roleName,
        description: data.description,
      },
    })

    return RoleMapper.toDomainRole(updated)!
  }

  async delete(id: number): Promise<void> {
    const numericId = NumberUtil.ensureValidId(id, 'Role ID')

    await this.prisma.role.delete({
      where: { roleId: numericId },
    })
  }

  async exists(id: number): Promise<boolean> {
    const numericId = NumberUtil.ensureValidId(id, 'Role ID')

    const count = await this.prisma.role.count({
      where: { roleId: numericId },
    })
    return count > 0
  }

  async count(): Promise<number> {
    return await this.prisma.role.count()
  }

  async getUserRoles(userId: number): Promise<UserRole[]> {
    const numericUserId = NumberUtil.ensureValidId(userId, 'User ID')

    // Truy cập UserRole thông qua User relationship
    const user = await this.prisma.user.findUnique({
      where: { userId: numericUserId, isActive: true },
      include: {
        userRoles: {
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user || !user.userRoles) {
      console.log('No user or userRoles found for userId:', numericUserId)
      return []
    }

    return UserRoleMapper.toDomainUserRoles(user.userRoles)
  }

  async getUserRole(userId: number, roleId: number): Promise<UserRole | null> {
    const numericUserId = NumberUtil.ensureValidId(userId, 'User ID')
    const numericRoleId = NumberUtil.ensureValidId(roleId, 'Role ID')
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: numericUserId,
          roleId: numericRoleId,
        },
      },
      include: {
        role: true,
      },
    })
    if (!userRole) {
      return null
    }
    return UserRoleMapper.toDomainUserRole(userRole)!
  }

  async assignRoleToUser(userId: number, roleId: number, assignedBy?: number, expiresAt?: Date): Promise<UserRole> {
    const numericUserId = NumberUtil.ensureValidId(userId, 'User ID')
    const numericRoleId = NumberUtil.ensureValidId(roleId, 'Role ID')

    const created = await this.prisma.userRole.create({
      data: {
        userId: numericUserId,
        roleId: numericRoleId,
        assignedAt: new Date(),
        isActive: true,
        assignedBy: assignedBy || null,
        expiresAt: expiresAt || null,
      },
      include: {
        role: true,
      },
    })

    return new UserRole(
      created.userId,
      created.roleId,
      created.assignedAt,
      created.expiresAt,
      created.assignedBy,
      created.isActive,
      new Role(
        created.role.roleId,
        created.role.roleName,
        created.role.description,
        created.role.isAssignable,
        created.role.requiredByRoleId,
        created.role.createdAt,
      ),
    )
  }

  async updateUserRole(userId: number, roleId: number, data: Partial<UserRole>): Promise<UserRole> {
    {
      const numericUserId = NumberUtil.ensureValidId(userId, 'User ID')
      const numericRoleId = NumberUtil.ensureValidId(roleId, 'Role ID')
      const dataToUpdate: any = {}

      if (data.expiresAt !== undefined) {
        dataToUpdate.expiresAt = data.expiresAt
      }
      if (data.isActive !== undefined) {
        dataToUpdate.isActive = data.isActive
        if (data.isActive) {
          dataToUpdate.assignedAt = new Date()
        }
      }
      if (data.assignedBy !== undefined) {
        dataToUpdate.assignedBy = data.assignedBy
      }

      const updated = await this.prisma.userRole.update({
        where: {
          userId_roleId: {
            userId: numericUserId,
            roleId: numericRoleId,
          },
        },
        data: dataToUpdate,
      })

      if (updated.count === 0) {
        throw new Error('No active user role found to update')
      }
      const userRoleRecord = await this.prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: numericUserId,
            roleId: numericRoleId,
          },
        },
        include: {
          role: true,
        },
      })
      return new UserRole(
        userRoleRecord!.userId,
        userRoleRecord!.roleId,
        userRoleRecord!.assignedAt,
        userRoleRecord!.expiresAt,
        userRoleRecord!.assignedBy,
        userRoleRecord!.isActive,
        new Role(
          userRoleRecord!.role.roleId,
          userRoleRecord!.role.roleName,
          userRoleRecord!.role.description,
          userRoleRecord!.role.isAssignable,
          userRoleRecord!.role.requiredByRoleId,
          userRoleRecord!.role.createdAt,
        ),
      )
    }
  }

  async removeRoleFromUser(userId: number, roleId: number, removedBy?: number): Promise<void> {
    const numericUserId = NumberUtil.ensureValidId(userId, 'User ID')
    const numericRoleId = NumberUtil.ensureValidId(roleId, 'Role ID')
    await this.prisma.userRole.updateMany({
      where: {
        userId: numericUserId,
        roleId: numericRoleId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })
  }

  async hasRole(userId: number, roleId: number): Promise<boolean> {
    const numericUserId = NumberUtil.ensureValidId(userId, 'User ID')
    const numericRoleId = NumberUtil.ensureValidId(roleId, 'Role ID')
    const count = await this.prisma.userRole.count({
      where: {
        userId: numericUserId,
        roleId: numericRoleId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })
    return count > 0
  }


  async hasPermission(roleId: number, permissionId: number): Promise<boolean> {
    const numericRoleId = NumberUtil.ensureValidId(roleId, 'Role ID')
    const numericPermissionId = NumberUtil.ensureValidId(permissionId, 'Permission ID')

    const count = await this.prisma.rolePermission.count({
      where: {
        roleId: numericRoleId,
        permissionId: numericPermissionId,
      },
    })

    return count > 0
  }

  async addPermission(roleId: number, permissionId: number): Promise<void> {
    const numericRoleId = NumberUtil.ensureValidId(roleId, 'Role ID')
    const numericPermissionId = NumberUtil.ensureValidId(permissionId, 'Permission ID')

    await this.prisma.rolePermission.create({
      data: {
        roleId: numericRoleId,
        permissionId: numericPermissionId,
      },
    })
  }

  async removePermission(roleId: number, permissionId: number): Promise<void> {
    const numericRoleId = NumberUtil.ensureValidId(roleId, 'Role ID')
    const numericPermissionId = NumberUtil.ensureValidId(permissionId, 'Permission ID')

    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId: numericRoleId,
          permissionId: numericPermissionId,
        },
      },
    })
  }
}
