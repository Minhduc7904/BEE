import type { NotificationDispatchRecipient as PrismaNotificationDispatchRecipient } from '@prisma/client'
import { NotificationDispatchRecipient } from '../../../domain/entities/notification'
import { NotificationRecipientType } from '../../../shared/enums'

export class NotificationDispatchRecipientMapper {
  static toDomain(record: PrismaNotificationDispatchRecipient | null): NotificationDispatchRecipient | null {
    if (!record) return null

    return new NotificationDispatchRecipient({
      notificationDispatchRecipientId: record.notificationDispatchRecipientId,
      notificationDispatchJobId: record.notificationDispatchJobId,
      userId: record.userId ?? undefined,
      recipientType: record.recipientType as NotificationRecipientType,
      profileId: record.profileId ?? undefined,
      displayName: record.displayName ?? undefined,
      email: record.email ?? undefined,
      phone: record.phone ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  static toDomainList(records: PrismaNotificationDispatchRecipient[]): NotificationDispatchRecipient[] {
    return records.map((record) => this.toDomain(record)!)
  }
}
