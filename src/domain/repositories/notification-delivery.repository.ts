import { NotificationDelivery } from '../entities/notification'
import type {
  CreateNotificationDeliveryData,
  NotificationDeliveryRecoveryResult,
  NotificationDeliveryStatusCounts,
  UpdateNotificationDeliveryData,
} from '../interface/notification-dispatch'

export interface INotificationDeliveryRepository {
  createMany(data: CreateNotificationDeliveryData[]): Promise<number>
  hasDue(now: Date): Promise<boolean>
  recoverExpired(now: Date): Promise<NotificationDeliveryRecoveryResult>
  claimDueBatch(workerId: string, now: Date, leaseExpiresAt: Date, take: number): Promise<NotificationDelivery[]>
  update(notificationDeliveryId: number, data: UpdateNotificationDeliveryData): Promise<NotificationDelivery>
  countByJob(notificationDispatchJobId: number): Promise<NotificationDeliveryStatusCounts>
}
