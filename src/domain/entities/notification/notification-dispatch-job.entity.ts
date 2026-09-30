import {
  NotificationDispatchJobStatus,
  NotificationDispatchJobType,
  NotificationLevel,
  NotificationType,
  NotificationAudienceType,
  NotificationRecipientType,
  NotificationDeliveryChannel,
} from '../../../shared/enums'

export class NotificationDispatchJob {
  notificationDispatchJobId: number
  jobType: NotificationDispatchJobType
  status: NotificationDispatchJobStatus
  title: string
  message: string
  type: NotificationType
  level: NotificationLevel
  scheduledAt: Date
  priority: number
  idempotencyKey: string
  requestFingerprint?: string
  audienceType: NotificationAudienceType
  audienceRecipientType?: NotificationRecipientType
  requestedChannels: NotificationDeliveryChannel[]
  recipientCount: number
  totalDeliveryCount: number
  sentDeliveryCount: number
  skippedDeliveryCount: number
  deadDeliveryCount: number
  createdAt: Date
  updatedAt: Date
  data?: Record<string, string>
  startedAt?: Date
  finishedAt?: Date
  createdByAdminId?: number
  sourceType?: string
  sourceId?: string
  sourceEvent?: string

  constructor(data: {
    notificationDispatchJobId: number
    jobType: NotificationDispatchJobType
    status: NotificationDispatchJobStatus
    title: string
    message: string
    type: NotificationType
    level: NotificationLevel
    scheduledAt: Date
    priority: number
    idempotencyKey: string
    requestFingerprint?: string
    audienceType: NotificationAudienceType
    audienceRecipientType?: NotificationRecipientType
    requestedChannels: NotificationDeliveryChannel[]
    recipientCount: number
    totalDeliveryCount: number
    sentDeliveryCount: number
    skippedDeliveryCount: number
    deadDeliveryCount: number
    createdAt: Date
    updatedAt: Date
    data?: Record<string, string>
    startedAt?: Date
    finishedAt?: Date
    createdByAdminId?: number
    sourceType?: string
    sourceId?: string
    sourceEvent?: string
  }) {
    Object.assign(this, data)
  }

  isTerminal(): boolean {
    return [
      NotificationDispatchJobStatus.SUCCEEDED,
      NotificationDispatchJobStatus.PARTIAL_FAILED,
      NotificationDispatchJobStatus.FAILED,
      NotificationDispatchJobStatus.CANCELLED,
    ].includes(this.status)
  }
}
