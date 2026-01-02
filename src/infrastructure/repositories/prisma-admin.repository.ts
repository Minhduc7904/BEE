// src/infrastructure/repositories/prisma-admin.repository.ts
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import type { IAdminRepository, FindAllAdminsOptions, FindAllAdminsResult } from '../../domain/repositories'
import type { CreateAdminData, UpdateAdminData } from '../../domain/interface'
import { Admin } from '../../domain/entities'
import { AdminMapper } from '../mappers'
import { NumberUtil } from '../../shared/utils'

export class PrismaAdminRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client

  async create(data: CreateAdminData): Promise<Admin> {
    const numericUserId = NumberUtil.ensureValidId(data.userId, 'User ID')

    const prismaAdmin = await this.prisma.admin.create({
      data: {
        userId: numericUserId,
        subjectId: data.subjectId,
      },
    })

    return AdminMapper.toDomainAdmin(prismaAdmin)!
  }

  async findById(id: number): Promise<Admin | null> {
    const numericId = NumberUtil.ensureValidId(id, 'Admin ID')

    const prismaAdmin = await this.prisma.admin.findUnique({
      where: { adminId: numericId },
      include: {
        user: {
          include: {
            userRoles: {
              where: {
                isActive: true,
              },
              include: {
                role: true
              },
            },
          },  
        }
      },
    })

    if (!prismaAdmin) return null

    return AdminMapper.toDomainAdmin(prismaAdmin)!
  }

  async findByUserId(userId: number): Promise<Admin | null> {
    const numericUserId = NumberUtil.ensureValidId(userId, 'User ID')

    const prismaAdmin = await this.prisma.admin.findUnique({
      where: { userId: numericUserId },
      include: {
        user: {
          include: {
            userRoles: {
              where: {
                isActive: true,
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
        },
        subject: true,
      },
    })

    if (!prismaAdmin) return null

    return AdminMapper.toDomainAdmin(prismaAdmin)!
  }

  async findAllWithPagination(
    options: FindAllAdminsOptions
  ): Promise<FindAllAdminsResult> {
    const where: Prisma.AdminWhereInput = {}

    if (options.search) {
      const keywords = options.search.trim().split(/\s+/)

      where.OR = [
        // 1️⃣ Search by email
        { user: { email: { contains: options.search } } },

        // 2️⃣ Search by full name (virtual)
        {
          AND: keywords.map((keyword) => ({
            OR: [
              { user: { firstName: { contains: keyword } } },
              { user: { lastName: { contains: keyword } } },
            ],
          })),
        },
      ]
    }

    const sortableFields = ['adminId', 'createdAt', 'updatedAt'] as const
    const isValidSortField = (
      field: string
    ): field is (typeof sortableFields)[number] =>
      (sortableFields as readonly string[]).includes(field)
    const orderBy: Prisma.AdminOrderByWithRelationInput = {}

    if (options.sortBy && isValidSortField(options.sortBy)) {
      orderBy[options.sortBy] = options.sortOrder ?? 'asc'
    } else {
      orderBy.adminId = 'asc'
    }

    const skip = Math.max(options.skip ?? 0, 0)
    const take = Math.min(options.take ?? 10, 100)

    const [admins, total] = await this.prisma.$transaction([
      this.prisma.admin.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user:
          {
            include: {
              userRoles: {
                where: {
                  isActive: true,
                },
                include: {
                  role: true,
                },
              },
            },
          }
        },
      }),
      this.prisma.admin.count({ where }),
    ])

    return {
      data: AdminMapper.toDomainAdmins(admins),
      total,
    }
  }


  async update(id: number, data: UpdateAdminData): Promise<Admin> {
    const numericId = NumberUtil.ensureValidId(id, 'Admin ID')

    const prismaAdmin = await this.prisma.admin.update({
      where: { adminId: numericId },
      data: {
        subjectId: data.subjectId,
      },
    })

    return AdminMapper.toDomainAdmin(prismaAdmin)!
  }

  async delete(id: number): Promise<boolean> {
    const numericId = NumberUtil.ensureValidId(id, 'Admin ID')

    try {
      await this.prisma.admin.delete({
        where: { adminId: numericId },
      })
      return true
    } catch (error) {
      return false
    }
  }

  async findAll(): Promise<Admin[]> {
    const prismaAdmins = await this.prisma.admin.findMany({
      include: { user: true },
    })

    return AdminMapper.toDomainAdmins(prismaAdmins)
  }
}
