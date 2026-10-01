/** Đồng bộ với Prisma enum BusinessNotificationOutboxStatus. */
export enum BusinessNotificationOutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  RETRY_WAIT = 'RETRY_WAIT',
  PUBLISHED = 'PUBLISHED',
  DEAD = 'DEAD',
}
