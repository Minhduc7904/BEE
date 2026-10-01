import { BusinessNotificationOutboxStatus } from '../../../shared/enums'

export class BusinessNotificationOutbox {
  businessNotificationOutboxId: number
  status: BusinessNotificationOutboxStatus
  sourceType: string
  sourceId: string
  sourceEvent: string
  idempotencyKey: string
  payload: Record<string, unknown>
  attemptCount: number
  maxAttempts: number
  availableAt: Date
  createdAt: Date
  updatedAt: Date
  claimedBy?: string
  claimedAt?: Date
  leaseExpiresAt?: Date
  lastErrorCode?: string
  lastErrorMessage?: string
  publishedAt?: Date

  constructor(data: Omit<BusinessNotificationOutbox, 'canRetry'>) {
    Object.assign(this, data)
  }

  canRetry(): boolean {
    return this.attemptCount < this.maxAttempts
  }
}
