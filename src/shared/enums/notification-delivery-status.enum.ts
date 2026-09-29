/** Đồng bộ với Prisma enum NotificationDeliveryStatus. */
export enum NotificationDeliveryStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  RETRY_WAIT = 'RETRY_WAIT',
  SENT = 'SENT',
  SKIPPED = 'SKIPPED',
  DEAD = 'DEAD',
  CANCELLED = 'CANCELLED',
}
