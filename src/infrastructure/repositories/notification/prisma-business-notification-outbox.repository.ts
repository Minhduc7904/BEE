import { Prisma } from '@prisma/client'
import type { BusinessNotificationOutbox } from '../../../domain/entities/notification'
import type {
  CreateBusinessNotificationOutboxData,
  IBusinessNotificationOutboxRepository,
  UpdateBusinessNotificationOutboxData,
} from '../../../domain/repositories'
import { PrismaService } from '../../../prisma/prisma.service'
import { BusinessNotificationOutboxStatus } from '../../../shared/enums'
import { BusinessNotificationOutboxMapper } from '../../mappers/notification/business-notification-outbox.mapper'

export class PrismaBusinessNotificationOutboxRepository implements IBusinessNotificationOutboxRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async createOrGet(data: CreateBusinessNotificationOutboxData): Promise<BusinessNotificationOutbox> {
    const record = await this.prisma.businessNotificationOutbox.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      create: { ...data, payload: data.payload as Prisma.InputJsonValue },
      update: {},
    })
    return BusinessNotificationOutboxMapper.toDomain(record)
  }

  async hasDue(now: Date): Promise<boolean> {
    return (
      (await this.prisma.businessNotificationOutbox.findFirst({
        where: {
          OR: [
            {
              status: { in: [BusinessNotificationOutboxStatus.PENDING, BusinessNotificationOutboxStatus.RETRY_WAIT] },
              availableAt: { lte: now },
            },
            { status: BusinessNotificationOutboxStatus.PROCESSING, leaseExpiresAt: { lte: now } },
          ],
        },
        select: { businessNotificationOutboxId: true },
      })) !== null
    )
  }

  async recoverExpired(now: Date): Promise<number> {
    const dead = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE business_notification_outbox
      SET status = 'DEAD', claimed_by = NULL, claimed_at = NULL, lease_expires_at = NULL,
          last_error_code = 'OUTBOX_LEASE_EXPIRED', last_error_message = 'Worker dừng trước khi publish outbox'
      WHERE status = 'PROCESSING' AND lease_expires_at <= ${now} AND attempt_count >= max_attempts
    `)
    const retried = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE business_notification_outbox
      SET status = 'RETRY_WAIT', available_at = ${now}, claimed_by = NULL, claimed_at = NULL, lease_expires_at = NULL,
          last_error_code = 'OUTBOX_LEASE_EXPIRED', last_error_message = 'Worker dừng trước khi publish outbox'
      WHERE status = 'PROCESSING' AND lease_expires_at <= ${now} AND attempt_count < max_attempts
    `)
    return dead + retried
  }

  async claimDueBatch(
    workerId: string,
    now: Date,
    leaseExpiresAt: Date,
    take: number,
  ): Promise<BusinessNotificationOutbox[]> {
    const ids = await this.prisma.$queryRaw<Array<{ businessNotificationOutboxId: number }>>(Prisma.sql`
      SELECT business_notification_outbox_id AS businessNotificationOutboxId
      FROM business_notification_outbox
      WHERE status IN ('PENDING', 'RETRY_WAIT') AND available_at <= ${now}
      ORDER BY available_at ASC, business_notification_outbox_id ASC
      LIMIT ${take}
      FOR UPDATE SKIP LOCKED
    `)
    if (ids.length === 0) return []
    const outboxIds = ids.map((item) => item.businessNotificationOutboxId)
    await this.prisma.businessNotificationOutbox.updateMany({
      where: { businessNotificationOutboxId: { in: outboxIds } },
      data: {
        status: BusinessNotificationOutboxStatus.PROCESSING,
        claimedBy: workerId,
        claimedAt: now,
        leaseExpiresAt,
        attemptCount: { increment: 1 },
      },
    })
    const records = await this.prisma.businessNotificationOutbox.findMany({
      where: { businessNotificationOutboxId: { in: outboxIds } },
      orderBy: { businessNotificationOutboxId: 'asc' },
    })
    return records.map((record) => BusinessNotificationOutboxMapper.toDomain(record))
  }

  async update(id: number, data: UpdateBusinessNotificationOutboxData): Promise<BusinessNotificationOutbox> {
    const record = await this.prisma.businessNotificationOutbox.update({
      where: { businessNotificationOutboxId: id },
      data,
    })
    return BusinessNotificationOutboxMapper.toDomain(record)
  }
}
