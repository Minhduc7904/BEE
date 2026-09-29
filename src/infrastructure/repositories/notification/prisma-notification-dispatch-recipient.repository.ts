import { Prisma } from '@prisma/client'
import { NotificationDispatchRecipient } from '../../../domain/entities/notification'
import type { CreateNotificationDispatchRecipientData } from '../../../domain/interface/notification-dispatch'
import type { INotificationDispatchRecipientRepository } from '../../../domain/repositories'
import { PrismaService } from '../../../prisma/prisma.service'
import { NotificationDispatchRecipientMapper } from '../../mappers/notification/notification-dispatch-recipient.mapper'

export class PrismaNotificationDispatchRecipientRepository implements INotificationDispatchRecipientRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async createMany(data: CreateNotificationDispatchRecipientData[]): Promise<NotificationDispatchRecipient[]> {
    if (data.length === 0) return []
    await this.prisma.notificationDispatchRecipient.createMany({ data, skipDuplicates: true })
    const jobIds = Array.from(new Set(data.map((item) => item.notificationDispatchJobId)))
    const userIds = Array.from(new Set(data.map((item) => item.userId)))
    const records = await this.prisma.notificationDispatchRecipient.findMany({
      where: {
        notificationDispatchJobId: { in: jobIds },
        userId: { in: userIds },
      },
      orderBy: { notificationDispatchRecipientId: 'asc' },
    })
    return NotificationDispatchRecipientMapper.toDomainList(records)
  }
}
