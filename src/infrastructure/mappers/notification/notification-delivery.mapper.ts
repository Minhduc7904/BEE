import { Prisma, type NotificationDelivery as PrismaNotificationDelivery } from '@prisma/client'
import { NotificationDelivery } from '../../../domain/entities/notification'
import { NotificationDeliveryChannel, NotificationDeliveryStatus } from '../../../shared/enums'
import { NotificationDispatchJobMapper } from './notification-dispatch-job.mapper'
import { NotificationDispatchRecipientMapper } from './notification-dispatch-recipient.mapper'
import type { NotificationDeliveryPayload } from '../../../domain/interface/notification-dispatch'

export type PrismaNotificationDeliveryWithContext = Prisma.NotificationDeliveryGetPayload<{
  include: { recipient: { include: { job: true } } }
}>

export class NotificationDeliveryMapper {
  static toDomain(
    record: PrismaNotificationDelivery | PrismaNotificationDeliveryWithContext | null,
  ): NotificationDelivery | null {
    if (!record) return null
    const contextual = record as Partial<PrismaNotificationDeliveryWithContext>

    return new NotificationDelivery({
      notificationDeliveryId: record.notificationDeliveryId,
      notificationDispatchRecipientId: record.notificationDispatchRecipientId,
      channel: record.channel as NotificationDeliveryChannel,
      status: record.status as NotificationDeliveryStatus,
      attemptCount: record.attemptCount,
      maxAttempts: record.maxAttempts,
      availableAt: record.availableAt,
      claimedBy: record.claimedBy ?? undefined,
      claimedAt: record.claimedAt ?? undefined,
      leaseExpiresAt: record.leaseExpiresAt ?? undefined,
      providerMessageId: record.providerMessageId ?? undefined,
      payload: (record.payload as unknown as NotificationDeliveryPayload | null) ?? undefined,
      destination: record.destination ?? undefined,
      providerAppId: record.providerAppId ?? undefined,
      pendingPushTokens: (record.pendingPushTokens as string[] | null) ?? undefined,
      lastErrorCode: record.lastErrorCode ?? undefined,
      lastErrorMessage: record.lastErrorMessage ?? undefined,
      skipReason: record.skipReason ?? undefined,
      sentAt: record.sentAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      recipient: contextual.recipient
        ? (NotificationDispatchRecipientMapper.toDomain(contextual.recipient) ?? undefined)
        : undefined,
      job: contextual.recipient?.job
        ? (NotificationDispatchJobMapper.toDomain(contextual.recipient.job) ?? undefined)
        : undefined,
    })
  }

  static toDomainList(records: PrismaNotificationDeliveryWithContext[]): NotificationDelivery[] {
    return records.map((record) => this.toDomain(record)!)
  }
}
