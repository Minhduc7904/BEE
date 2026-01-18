import { Injectable } from '@nestjs/common'
import { Permission } from '../../../domain/entities/role/permission.entity'
import {
  CreatePermissionData,
  IPermissionRepository,
  UpdatePermissionData,
  FindAllPermissionsOptions,
  FindAllPermissionsResult,
} from '../../../domain/repositories'
import { PrismaService } from '../../../prisma/prisma.service'
import { PermissionMapper } from '../../mappers'
import { NumberUtil } from '../../../shared/utils'

@Injectable()
export class PrismaPermissionRepository implements IPermissionRepository {
  constructor(private readonly prisma: PrismaService | any) {} // any để hỗ trợ transaction client

  async create(data: CreatePermissionData): Promise<Permission> {
    const created = await this.prisma.permission.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        group: data.group,
        isSystem: data.isSystem ?? false,
      },
    })

    return PermissionMapper.toDomainPermission(created)!
  }

  async findById(id: number): Promise<Permission | null> {
    const numericId = NumberUtil.ensureValidId(id, 'Permission ID')

    const permission = await this.prisma.permission.findUnique({
      where: { permissionId: numericId },
    })

    if (!permission) return null

    return PermissionMapper.toDomainPermission(permission)!
  }

  async findByCode(code: string): Promise<Permission | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { code: code },
    })

    if (!permission) return null

    return PermissionMapper.toDomainPermission(permission)!
  }

  async findAll(limit?: number, offset?: number): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      take: limit,
      skip: offset,
      orderBy: [
        { group: 'asc' },
        { code: 'asc' },
      ],
    })

    return PermissionMapper.toDomainPermissions(permissions)
  }

  async findAllWithPagination(options: FindAllPermissionsOptions): Promise<FindAllPermissionsResult> {
    const where: any = {}

    // Search filter
    if (options.search) {
      where.OR = [
        { code: { contains: options.search } },
        { name: { contains: options.search } },
        { description: { contains: options.search } },
      ]
    }

    // Group filter
    if (options.group) {
      where.group = options.group
    }

    // Sort configuration
    const orderBy: any = {}
    if (options.sortBy) {
      orderBy[options.sortBy] = options.sortOrder || 'desc'
    } else {
      // Default sort
      orderBy.createdAt = 'desc'
    }

    // Execute queries in parallel
    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        orderBy,
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.permission.count({ where }),
    ])

    return {
      data: PermissionMapper.toDomainPermissions(permissions),
      total,
    }
  }

  async findByGroup(group: string): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { group: group },
      orderBy: { code: 'asc' },
    })

    return PermissionMapper.toDomainPermissions(permissions)
  }

  async getDistinctGroups(): Promise<string[]> {
    const result = await this.prisma.permission.findMany({
      select: {
        group: true,
      },
      distinct: ['group'],
      where: {
        group: {
          not: null,
        },
      },
      orderBy: {
        group: 'asc',
      },
    })

    return result.map((item: any) => item.group).filter((group: string | null) => group !== null)
  }

  async update(id: number, data: UpdatePermissionData): Promise<Permission> {
    const numericId = NumberUtil.ensureValidId(id, 'Permission ID')

    const updated = await this.prisma.permission.update({
      where: { permissionId: numericId },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        group: data.group,
        isSystem: data.isSystem,
      },
    })

    return PermissionMapper.toDomainPermission(updated)!
  }

  async delete(id: number): Promise<void> {
    const numericId = NumberUtil.ensureValidId(id, 'Permission ID')

    await this.prisma.permission.delete({
      where: { permissionId: numericId },
    })
  }
}
