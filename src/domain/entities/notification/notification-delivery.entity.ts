import { NotificationDeliveryChannel, NotificationDeliveryStatus } from '../../../shared/enums'
import type { NotificationDeliveryPayload } from '../../interface/notification-dispatch'
import { NotificationDispatchJob } from './notification-dispatch-job.entity'
import { NotificationDispatchRecipient } from './notification-dispatch-recipient.entity'

export class NotificationDelivery {
  notificationDeliveryId: number
  notificationDispatchRecipientId: number
  channel: NotificationDeliveryChannel
  status: NotificationDeliveryStatus
  attemptCount: number
  maxAttempts: number
  availableAt: Date
  createdAt: Date
  updatedAt: Date
  claimedBy?: string
  claimedAt?: Date
  leaseExpiresAt?: Date
  providerMessageId?: string
  payload?: NotificationDeliveryPayload
  destination?: string
  providerAppId?: string
  pendingPushTokens?: string[]
  lastErrorCode?: string
  lastErrorMessage?: string
  skipReason?: string
  sentAt?: Date
  recipient?: NotificationDispatchRecipient
  job?: NotificationDispatchJob

  constructor(data: {
    notificationDeliveryId: number
    notificationDispatchRecipientId: number
    channel: NotificationDeliveryChannel
    status: NotificationDeliveryStatus
    attemptCount: number
    maxAttempts: number
    availableAt: Date
    createdAt: Date
    updatedAt: Date
    claimedBy?: string
    claimedAt?: Date
    leaseExpiresAt?: Date
    providerMessageId?: string
    payload?: NotificationDeliveryPayload
    destination?: string
    providerAppId?: string
    pendingPushTokens?: string[]
    lastErrorCode?: string
    lastErrorMessage?: string
    skipReason?: string
    sentAt?: Date
    recipient?: NotificationDispatchRecipient
    job?: NotificationDispatchJob
  }) {
    Object.assign(this, data)
  }

  canRetry(): boolean {
    return this.attemptCount < this.maxAttempts
  }
}
