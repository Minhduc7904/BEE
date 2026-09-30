import { NotificationDispatchRecipient } from '../entities/notification'
import type {
  CreateNotificationDispatchRecipientData,
  NotificationDispatchRecipientListOptions,
  NotificationRecipientSearchOptions,
  NotificationRecipientSnapshot,
} from '../interface/notification-dispatch'

export interface INotificationDispatchRecipientRepository {
  createMany(data: CreateNotificationDispatchRecipientData[]): Promise<NotificationDispatchRecipient[]>
  resolveSnapshots(userIds: number[]): Promise<NotificationRecipientSnapshot[]>
  search(
    options: NotificationRecipientSearchOptions,
  ): Promise<{ items: NotificationRecipientSnapshot[]; total: number }>
  findAllByJob(
    notificationDispatchJobId: number,
    options: NotificationDispatchRecipientListOptions,
  ): Promise<{ items: Record<string, unknown>[]; total: number }>
}
