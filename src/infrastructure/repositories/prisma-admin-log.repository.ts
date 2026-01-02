// src/infrastructure/repositories/prisma-admin-log.repository.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { IAdminAuditLogRepository } from '../../domain/repositories'
import { AdminAuditLog } from '../../domain/entities'
import { CreateLogDto } from '../../application/dtos'
import { AuditLogListQueryDto } from '../../application/dtos/log/audit-log-list-query.dto'
import { AdminAuditLogMapper } from '../mappers'
import { AuditStatus } from '../../shared/enums'
import { NumberUtil } from '../../shared/utils'

export class PrismaAdminLogRepository implements IAdminAuditLogRepository {
  constructor(private readonly prisma: PrismaService | any) { }

  async create(data: CreateLogDto): Promise<AdminAuditLog> {
    const created = await this.prisma.adminAuditLog.create({
      data: {
        adminId: data.adminId,
        actionKey: data.actionKey,
        status: data.status,
        errorMessage: data.errorMessage,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        beforeData: data.beforeData,
        afterData: data.afterData,
      },
    })

    return AdminAuditLogMapper.toDomainAdminAuditLog(created)!
  }

  async updateStatus(id: number, status: AuditStatus): Promise<AdminAuditLog> {
    const numericId = NumberUtil.ensureValidId(id, 'Log ID')

    const updated = await this.prisma.adminAuditLog.update({
      where: { logId: numericId },
      data: {
        status,
      },
    })

    return AdminAuditLogMapper.toDomainAdminAuditLog(updated)!
  }

  async findById(id: number): Promise<AdminAuditLog | null> {
    const numericId = NumberUtil.ensureValidId(id, 'Log ID')

    const log = await this.prisma.adminAuditLog.findUnique({
      where: { logId: numericId },
      include: {
        admin: {
          include: {
            user: {
              include: {
                avatar: true
              }
            }
          }
        }
      },
    })

    return AdminAuditLogMapper.toDomainAdminAuditLog(log)
  }

  async findByAdminId(adminId: number): Promise<AdminAuditLog[]> {
    const numericAdminId = NumberUtil.ensureValidId(adminId, 'Admin ID')

    const logs = await this.prisma.adminAuditLog.findMany({
      where: { adminId: numericAdminId },
      include: { admin: true },
    })

    return AdminAuditLogMapper.toDomainAdminAuditLogs(logs)
  }

  async findByActionKey(actionKey: string): Promise<AdminAuditLog[]> {
    const logs = await this.prisma.adminAuditLog.findMany({
      where: { actionKey },
      include: { admin: true },
    })

    return AdminAuditLogMapper.toDomainAdminAuditLogs(logs)
  }
  async findByResourceType(resourceType: string): Promise<AdminAuditLog[]> {
    const logs = await this.prisma.adminAuditLog.findMany({
      where: { resourceType },
      include: { admin: true },
    })
    return AdminAuditLogMapper.toDomainAdminAuditLogs(logs)
  }
  async findByResourceId(resourceId: string): Promise<AdminAuditLog[]> {
    const logs = await this.prisma.adminAuditLog.findMany({
      where: { resourceId },
      include: { admin: true },
    })
    return AdminAuditLogMapper.toDomainAdminAuditLogs(logs)
  }
  async findAll(): Promise<AdminAuditLog[]> {
    const logs = await this.prisma.adminAuditLog.findMany({
      include: { admin: true },
      orderBy: { createdAt: 'desc' },
    })
    return AdminAuditLogMapper.toDomainAdminAuditLogs(logs)
  }

  async findAllWithPagination(query: AuditLogListQueryDto): Promise<{ data: AdminAuditLog[]; total: number }> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', adminId, actionKey, resourceType, resourceId, status, fromDate, toDate } = query

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { actionKey: { contains: search } },
        { resourceType: { contains: search } },
        { resourceId: { contains: search } },
      ]
    }

    if (adminId) {
      where.adminId = NumberUtil.ensureValidId(adminId, 'Admin ID')
    }

    if (actionKey) {
      where.actionKey = { contains: actionKey }
    }

    if (resourceType) {
      where.resourceType = { contains: resourceType }
    }

    if (resourceId) {
      where.resourceId = { contains: resourceId }
    }

    if (status) {
      where.status = status
    }

    // Date range filter
    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate)
      }
      if (toDate) {
        where.createdAt.lte = new Date(toDate)
      }
    }

    // Execute queries
    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          admin: {
            include: {
              user: true
            }
          }
        },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ])

    return {
      data: AdminAuditLogMapper.toDomainAdminAuditLogs(logs),
      total,
    }
  }
}
