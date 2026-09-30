import type { NotificationDispatchJob as PrismaNotificationDispatchJob } from '@prisma/client'
import { NotificationDispatchJob } from '../../../domain/entities/notification'
import {
  NotificationDispatchJobStatus,
  NotificationDispatchJobType,
  NotificationLevel,
  NotificationType,
  NotificationAudienceType,
  NotificationRecipientType,
  NotificationDeliveryChannel,
} from '../../../shared/enums'

export class NotificationDispatchJobMapper {
  static toDomain(record: PrismaNotificationDispatchJob | null): NotificationDispatchJob | null {
    if (!record) return null

    return new NotificationDispatchJob({
      notificationDispatchJobId: record.notificationDispatchJobId,
      jobType: record.jobType as NotificationDispatchJobType,
      status: record.status as NotificationDispatchJobStatus,
      title: record.title,
      message: record.message,
      type: record.type as NotificationType,
      level: record.level as NotificationLevel,
      data: (record.data as Record<string, string> | null) ?? undefined,
      scheduledAt: record.scheduledAt,
      startedAt: record.startedAt ?? undefined,
      finishedAt: record.finishedAt ?? undefined,
      priority: record.priority,
      idempotencyKey: record.idempotencyKey,
      requestFingerprint: record.requestFingerprint ?? undefined,
      audienceType: record.audienceType as NotificationAudienceType,
      audienceRecipientType: (record.audienceRecipientType as NotificationRecipientType | null) ?? undefined,
      requestedChannels: (record.requestedChannels as NotificationDeliveryChannel[] | null) ?? [],
      recipientCount: record.recipientCount,
      totalDeliveryCount: record.totalDeliveryCount,
      sentDeliveryCount: record.sentDeliveryCount,
      skippedDeliveryCount: record.skippedDeliveryCount,
      deadDeliveryCount: record.deadDeliveryCount,
      createdByAdminId: record.createdByAdminId ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
