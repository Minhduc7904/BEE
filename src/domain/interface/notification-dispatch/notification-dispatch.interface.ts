import {
  NotificationDeliveryChannel,
  NotificationDeliveryStatus,
  NotificationDispatchJobStatus,
  NotificationDispatchJobType,
  NotificationLevel,
  NotificationType,
} from '../../../shared/enums'

export interface CreateNotificationDispatchJobData {
  jobType: NotificationDispatchJobType
  title: string
  message: string
  type: NotificationType
  level: NotificationLevel
  data?: Record<string, string>
  scheduledAt: Date
  priority: number
  idempotencyKey: string
  recipientCount: number
  totalDeliveryCount: number
  createdByAdminId?: number
}

export interface UpdateNotificationDispatchJobData {
  status?: NotificationDispatchJobStatus
  startedAt?: Date | null
  finishedAt?: Date | null
  sentDeliveryCount?: number
  skippedDeliveryCount?: number
  deadDeliveryCount?: number
}

export interface CreateNotificationDispatchRecipientData {
  notificationDispatchJobId: number
  userId: number
}

export interface CreateNotificationDeliveryData {
  notificationDispatchRecipientId: number
  channel: NotificationDeliveryChannel
  availableAt: Date
  maxAttempts?: number
}

export interface UpdateNotificationDeliveryData {
  status: NotificationDeliveryStatus
  availableAt?: Date
  providerMessageId?: string | null
  lastErrorCode?: string | null
  lastErrorMessage?: string | null
  skipReason?: string | null
  sentAt?: Date | null
  claimedBy?: string | null
  claimedAt?: Date | null
  leaseExpiresAt?: Date | null
}

export interface NotificationDeliveryStatusCounts {
  total: number
  pending: number
  processing: number
  retryWait: number
  sent: number
  skipped: number
  dead: number
  cancelled: number
}

export interface NotificationDeliveryRecoveryResult {
  count: number
  notificationDispatchJobIds: number[]
}
