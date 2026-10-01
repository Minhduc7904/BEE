import type { BusinessNotificationOutbox } from '../entities/notification'
import type { BusinessNotificationOutboxStatus } from '../../shared/enums'

export interface CreateBusinessNotificationOutboxData {
  sourceType: string
  sourceId: string
  sourceEvent: string
  idempotencyKey: string
  payload: Record<string, unknown>
  maxAttempts?: number
}

export interface UpdateBusinessNotificationOutboxData {
  status: BusinessNotificationOutboxStatus
  availableAt?: Date
  claimedBy?: string | null
  claimedAt?: Date | null
  leaseExpiresAt?: Date | null
  lastErrorCode?: string | null
  lastErrorMessage?: string | null
  publishedAt?: Date | null
}

export interface IBusinessNotificationOutboxRepository {
  createOrGet(data: CreateBusinessNotificationOutboxData): Promise<BusinessNotificationOutbox>
  hasDue(now: Date): Promise<boolean>
  recoverExpired(now: Date): Promise<number>
  claimDueBatch(workerId: string, now: Date, leaseExpiresAt: Date, take: number): Promise<BusinessNotificationOutbox[]>
  update(id: number, data: UpdateBusinessNotificationOutboxData): Promise<BusinessNotificationOutbox>
}
