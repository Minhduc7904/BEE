import { NotificationDispatchRecipient } from '../entities/notification'
import type { CreateNotificationDispatchRecipientData } from '../interface/notification-dispatch'

export interface INotificationDispatchRecipientRepository {
  createMany(data: CreateNotificationDispatchRecipientData[]): Promise<NotificationDispatchRecipient[]>
}
