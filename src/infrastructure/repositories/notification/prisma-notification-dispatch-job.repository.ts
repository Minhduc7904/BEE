import { Prisma } from '@prisma/client'
import { NotificationDispatchJob } from '../../../domain/entities/notification'
import type {
  CreateNotificationDispatchJobData,
  UpdateNotificationDispatchJobData,
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
}
