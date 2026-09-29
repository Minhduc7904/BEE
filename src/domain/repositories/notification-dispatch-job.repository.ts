import { NotificationDispatchJob } from '../entities/notification'
import type {
  CreateNotificationDispatchJobData,
  UpdateNotificationDispatchJobData,
} from '../interface/notification-dispatch'

export interface INotificationDispatchJobRepository {
  create(data: CreateNotificationDispatchJobData): Promise<NotificationDispatchJob>
  findById(notificationDispatchJobId: number): Promise<NotificationDispatchJob | null>
  findByIdempotencyKey(idempotencyKey: string): Promise<NotificationDispatchJob | null>
  update(notificationDispatchJobId: number, data: UpdateNotificationDispatchJobData): Promise<NotificationDispatchJob>
}
