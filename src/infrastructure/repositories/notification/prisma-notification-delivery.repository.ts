import { Prisma } from '@prisma/client'
import { NotificationDelivery } from '../../../domain/entities/notification'
import type {
  CreateNotificationDeliveryData,
  NotificationDeliveryRecoveryResult,
  NotificationDeliveryStatusCounts,
  UpdateNotificationDeliveryData,
} from '../../../domain/interface/notification-dispatch'
import type { INotificationDeliveryRepository } from '../../../domain/repositories'
import { PrismaService } from '../../../prisma/prisma.service'
import { NotificationDeliveryStatus } from '../../../shared/enums'
import { NotificationDeliveryMapper } from '../../mappers/notification/notification-delivery.mapper'

export class PrismaNotificationDeliveryRepository implements INotificationDeliveryRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async createMany(data: CreateNotificationDeliveryData[]): Promise<number> {
    if (data.length === 0) return 0
    const result = await this.prisma.notificationDelivery.createMany({ data, skipDuplicates: true })
    return result.count
  }

  async hasDue(now: Date): Promise<boolean> {
    const record = await this.prisma.notificationDelivery.findFirst({
      where: {
        OR: [
          {
            status: { in: [NotificationDeliveryStatus.PENDING, NotificationDeliveryStatus.RETRY_WAIT] },
            availableAt: { lte: now },
            recipient: { job: { scheduledAt: { lte: now }, status: { in: ['QUEUED', 'PROCESSING'] } } },
          },
          {
            status: NotificationDeliveryStatus.PROCESSING,
            leaseExpiresAt: { lte: now },
          },
        ],
      },
      select: { notificationDeliveryId: true },
    })
    return record !== null
  }

  async recoverExpired(now: Date): Promise<NotificationDeliveryRecoveryResult> {
    const expired = await this.prisma.notificationDelivery.findMany({
      where: {
        status: NotificationDeliveryStatus.PROCESSING,
        leaseExpiresAt: { lte: now },
      },
      select: { recipient: { select: { notificationDispatchJobId: true } } },
    })
    if (expired.length === 0) return { count: 0, notificationDispatchJobIds: [] }

    const dead = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE notification_deliveries
      SET status = 'DEAD', claimed_by = NULL, claimed_at = NULL, lease_expires_at = NULL,
          last_error_code = 'DELIVERY_LEASE_EXPIRED',
          last_error_message = 'Worker dừng trước khi hoàn tất delivery'
      WHERE status = 'PROCESSING' AND lease_expires_at <= ${now} AND attempt_count >= max_attempts
    `)
    const retried = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE notification_deliveries
      SET status = 'RETRY_WAIT', available_at = ${now}, claimed_by = NULL, claimed_at = NULL,
          lease_expires_at = NULL, last_error_code = 'DELIVERY_LEASE_EXPIRED',
          last_error_message = 'Worker dừng trước khi hoàn tất delivery'
      WHERE status = 'PROCESSING' AND lease_expires_at <= ${now} AND attempt_count < max_attempts
    `)
    return {
      count: dead + retried,
      notificationDispatchJobIds: Array.from(new Set(expired.map((item) => item.recipient.notificationDispatchJobId))),
    }
  }

  async claimDueBatch(
    workerId: string,
    now: Date,
    leaseExpiresAt: Date,
    take: number,
  ): Promise<NotificationDelivery[]> {
    const ids = await this.prisma.$queryRaw<Array<{ notificationDeliveryId: number }>>(Prisma.sql`
      SELECT d.notification_delivery_id AS notificationDeliveryId
      FROM notification_deliveries d
      INNER JOIN notification_dispatch_recipients r
        ON r.notification_dispatch_recipient_id = d.notification_dispatch_recipient_id
      INNER JOIN notification_dispatch_jobs j
        ON j.notification_dispatch_job_id = r.notification_dispatch_job_id
      WHERE d.status IN ('PENDING', 'RETRY_WAIT')
        AND d.available_at <= ${now}
        AND j.scheduled_at <= ${now}
        AND j.status IN ('QUEUED', 'PROCESSING')
      ORDER BY j.priority DESC, d.available_at ASC, d.notification_delivery_id ASC
      LIMIT ${take}
      FOR UPDATE SKIP LOCKED
    `)
    if (ids.length === 0) return []
    const deliveryIds = ids.map((item) => item.notificationDeliveryId)
    await this.prisma.notificationDelivery.updateMany({
      where: { notificationDeliveryId: { in: deliveryIds } },
      data: {
        status: NotificationDeliveryStatus.PROCESSING,
        claimedBy: workerId,
        claimedAt: now,
        leaseExpiresAt,
        attemptCount: { increment: 1 },
      },
    })
    const records = await this.prisma.notificationDelivery.findMany({
      where: { notificationDeliveryId: { in: deliveryIds } },
      include: { recipient: { include: { job: true } } },
      orderBy: { notificationDeliveryId: 'asc' },
    })
    return NotificationDeliveryMapper.toDomainList(records)
  }

  async update(notificationDeliveryId: number, data: UpdateNotificationDeliveryData): Promise<NotificationDelivery> {
    const updated = await this.prisma.notificationDelivery.update({
      where: { notificationDeliveryId },
      data,
    })
    return NotificationDeliveryMapper.toDomain(updated)!
  }

  async countByJob(notificationDispatchJobId: number): Promise<NotificationDeliveryStatusCounts> {
    const groups = await this.prisma.notificationDelivery.groupBy({
      by: ['status'],
      where: { recipient: { notificationDispatchJobId } },
      _count: { _all: true },
    })
    const counts: NotificationDeliveryStatusCounts = {
      total: 0,
      pending: 0,
      processing: 0,
      retryWait: 0,
      sent: 0,
      skipped: 0,
      dead: 0,
      cancelled: 0,
    }
    for (const group of groups) {
      const count = group._count._all
      counts.total += count
      if (group.status === 'PENDING') counts.pending = count
      if (group.status === 'PROCESSING') counts.processing = count
      if (group.status === 'RETRY_WAIT') counts.retryWait = count
      if (group.status === 'SENT') counts.sent = count
      if (group.status === 'SKIPPED') counts.skipped = count
      if (group.status === 'DEAD') counts.dead = count
      if (group.status === 'CANCELLED') counts.cancelled = count
    }
    return counts
  }
}
