import type { BusinessNotificationOutbox as PrismaBusinessNotificationOutbox } from '@prisma/client'
import { BusinessNotificationOutbox } from '../../../domain/entities/notification'
import { BusinessNotificationOutboxStatus } from '../../../shared/enums'

export class BusinessNotificationOutboxMapper {
  static toDomain(record: PrismaBusinessNotificationOutbox): BusinessNotificationOutbox {
    return new BusinessNotificationOutbox({
      businessNotificationOutboxId: record.businessNotificationOutboxId,
      status: record.status as BusinessNotificationOutboxStatus,
      sourceType: record.sourceType,
      sourceId: record.sourceId,
      sourceEvent: record.sourceEvent,
      idempotencyKey: record.idempotencyKey,
      payload: record.payload as Record<string, unknown>,
      attemptCount: record.attemptCount,
      maxAttempts: record.maxAttempts,
      availableAt: record.availableAt,
      claimedBy: record.claimedBy ?? undefined,
      claimedAt: record.claimedAt ?? undefined,
      leaseExpiresAt: record.leaseExpiresAt ?? undefined,
      lastErrorCode: record.lastErrorCode ?? undefined,
      lastErrorMessage: record.lastErrorMessage ?? undefined,
      publishedAt: record.publishedAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
