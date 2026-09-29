import type { NotificationDispatchRecipient as PrismaNotificationDispatchRecipient } from '@prisma/client'
import { NotificationDispatchRecipient } from '../../../domain/entities/notification'

export class NotificationDispatchRecipientMapper {
  static toDomain(record: PrismaNotificationDispatchRecipient | null): NotificationDispatchRecipient | null {
    if (!record) return null

    return new NotificationDispatchRecipient({
      notificationDispatchRecipientId: record.notificationDispatchRecipientId,
      notificationDispatchJobId: record.notificationDispatchJobId,
      userId: record.userId ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  static toDomainList(records: PrismaNotificationDispatchRecipient[]): NotificationDispatchRecipient[] {
    return records.map((record) => this.toDomain(record)!)
  }
}
