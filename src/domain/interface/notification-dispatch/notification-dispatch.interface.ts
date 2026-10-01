import {
  NotificationDeliveryChannel,
  NotificationDeliveryStatus,
  NotificationDispatchJobStatus,
  NotificationDispatchJobType,
  NotificationLevel,
  NotificationType,
  NotificationAudienceType,
  NotificationRecipientType,
  NotificationRecipientKind,
} from '../../../shared/enums'

export interface NotificationDeliveryPayload {
  title: string
  message: string
  type: NotificationType
  level: NotificationLevel
  data?: Record<string, unknown>
}

export interface CreateNotificationDispatchJobData {
  jobType: NotificationDispatchJobType
  title: string
  message: string
  type: NotificationType
  level: NotificationLevel
  data?: Record<string, unknown>
  scheduledAt: Date
  priority: number
  idempotencyKey: string
  requestFingerprint: string
  audienceType: NotificationAudienceType
  audienceRecipientType?: NotificationRecipientType
  requestedChannels: NotificationDeliveryChannel[]
  sourceType?: string
  sourceId?: string
  sourceEvent?: string
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
  recipientKey: string
  recipientKind: NotificationRecipientKind
  userId?: number
  recipientType: NotificationRecipientType
  sourceStudentId?: number
  profileId?: number
  displayName?: string
  email?: string
  phone?: string
}

export interface NotificationRecipientSnapshot {
  userId: number
  profileId: number
  recipientType: NotificationRecipientType
  displayName: string
  email?: string
  phone?: string
  grade?: number
}

export interface NotificationParentTarget extends NotificationRecipientSnapshot {
  studentId: number
}

export interface NotificationRecipientSearchOptions {
  recipientType: NotificationRecipientType
  search: string
  page: number
  limit: number
  grade?: number
}

export interface NotificationDispatchJobListOptions {
  page: number
  limit: number
  status?: NotificationDispatchJobStatus
  type?: NotificationType
  creatorId?: number
  search?: string
  from?: Date
  to?: Date
}

export interface NotificationDispatchRecipientListOptions {
  page: number
  limit: number
  recipientType?: NotificationRecipientType
  channel?: NotificationDeliveryChannel
  deliveryStatus?: NotificationDeliveryStatus
  search?: string
}

export interface CreateNotificationDeliveryData {
  notificationDispatchRecipientId: number
  channel: NotificationDeliveryChannel
  availableAt: Date
  maxAttempts?: number
  payload?: NotificationDeliveryPayload
  destination?: string
  providerAppId?: string
}

export interface NotificationDeliveryCommand {
  channel: NotificationDeliveryChannel
  payload: NotificationDeliveryPayload
  destination?: string
  providerAppId?: string
  maxAttempts?: number
}

export interface NotificationDispatchRecipientCommand {
  recipientKey: string
  recipientKind: NotificationRecipientKind
  recipientType: NotificationRecipientType
  userId?: number
  profileId?: number
  sourceStudentId?: number
  displayName?: string
  email?: string
  phone?: string
  deliveries: NotificationDeliveryCommand[]
}

export interface UpdateNotificationDeliveryData {
  status: NotificationDeliveryStatus
  availableAt?: Date
  pendingPushTokens?: string[] | null
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
