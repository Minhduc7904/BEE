import { NotificationDispatchJob } from '../entities/notification'
import type {
  CreateNotificationDispatchJobData,
  UpdateNotificationDispatchJobData,
  NotificationDispatchJobListOptions,
} from '../interface/notification-dispatch'

export interface INotificationDispatchJobRepository {
  create(data: CreateNotificationDispatchJobData): Promise<NotificationDispatchJob>
  findById(notificationDispatchJobId: number): Promise<NotificationDispatchJob | null>
  findByIdempotencyKey(idempotencyKey: string): Promise<NotificationDispatchJob | null>
  update(notificationDispatchJobId: number, data: UpdateNotificationDispatchJobData): Promise<NotificationDispatchJob>
  findAll(options: NotificationDispatchJobListOptions): Promise<{ items: Record<string, unknown>[]; total: number }>
  findDetailById(notificationDispatchJobId: number): Promise<Record<string, unknown> | null>
}
