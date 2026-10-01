import { Prisma } from '@prisma/client'
import { NotificationDispatchJob } from '../../../domain/entities/notification'
import type {
  CreateNotificationDispatchJobData,
  UpdateNotificationDispatchJobData,
  NotificationDispatchJobListOptions,
} from '../../../domain/interface/notification-dispatch'
import type { INotificationDispatchJobRepository } from '../../../domain/repositories'
import { PrismaService } from '../../../prisma/prisma.service'
import { NotificationDispatchJobMapper } from '../../mappers/notification/notification-dispatch-job.mapper'

export class PrismaNotificationDispatchJobRepository implements INotificationDispatchJobRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateNotificationDispatchJobData): Promise<NotificationDispatchJob> {
    const created = await this.prisma.notificationDispatchJob.create({
      data: {
        ...data,
        data: data.data as Prisma.InputJsonValue | undefined,
      },
    })
    return NotificationDispatchJobMapper.toDomain(created)!
  }

  async findById(notificationDispatchJobId: number): Promise<NotificationDispatchJob | null> {
    const record = await this.prisma.notificationDispatchJob.findUnique({ where: { notificationDispatchJobId } })
    return NotificationDispatchJobMapper.toDomain(record)
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<NotificationDispatchJob | null> {
    const record = await this.prisma.notificationDispatchJob.findUnique({ where: { idempotencyKey } })
    return NotificationDispatchJobMapper.toDomain(record)
  }

  async update(
    notificationDispatchJobId: number,
    data: UpdateNotificationDispatchJobData,
  ): Promise<NotificationDispatchJob> {
    const updated = await this.prisma.notificationDispatchJob.update({
      where: { notificationDispatchJobId },
      data,
    })
    return NotificationDispatchJobMapper.toDomain(updated)!
  }

  async findAll(
    options: NotificationDispatchJobListOptions,
  ): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const where: Prisma.NotificationDispatchJobWhereInput = {
      status: options.status,
      type: options.type,
      createdByAdminId: options.creatorId,
      createdAt: options.from || options.to ? { gte: options.from, lte: options.to } : undefined,
      OR: options.search
        ? [
            { title: { contains: options.search } },
            { message: { contains: options.search } },
            { idempotencyKey: { contains: options.search } },
            { sourceType: { contains: options.search } },
            { sourceId: { contains: options.search } },
            { sourceEvent: { contains: options.search } },
          ]
        : undefined,
    }
    const [records, total] = await Promise.all([
      this.prisma.notificationDispatchJob.findMany({
        where,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        orderBy: { createdAt: 'desc' },
        include: { createdByAdmin: { include: { user: true } } },
      }),
      this.prisma.notificationDispatchJob.count({ where }),
    ])
    return {
      total,
      items: records.map(({ createdByAdmin, requestedChannels, ...job }) => ({
        ...job,
        requestedChannels: requestedChannels ?? [],
        creator: createdByAdmin
          ? {
              adminId: createdByAdmin.adminId,
              displayName: `${createdByAdmin.user.lastName} ${createdByAdmin.user.firstName}`.trim(),
            }
          : null,
      })),
    }
  }

  async findDetailById(notificationDispatchJobId: number): Promise<Record<string, unknown> | null> {
    const job = await this.prisma.notificationDispatchJob.findUnique({
      where: { notificationDispatchJobId },
      include: { createdByAdmin: { include: { user: true } } },
    })
    if (!job) return null
    const grouped = await this.prisma.notificationDelivery.groupBy({
      by: ['channel', 'status'],
      where: { recipient: { notificationDispatchJobId } },
      _count: { _all: true },
    })
    const { createdByAdmin, requestedChannels, ...data } = job
    return {
      ...data,
      requestedChannels: requestedChannels ?? [],
      creator: createdByAdmin
        ? {
            adminId: createdByAdmin.adminId,
            displayName: `${createdByAdmin.user.lastName} ${createdByAdmin.user.firstName}`.trim(),
          }
        : null,
      deliverySummary: grouped.map((item) => ({ channel: item.channel, status: item.status, count: item._count._all })),
    }
  }
}
