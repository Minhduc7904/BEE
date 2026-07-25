import { ActionApprovalRequestStatus, ActionApprovalRequestType } from '../../../shared/enums'

export type ActionApprovalRequestJsonValue =
  | string
  | number
  | boolean
  | null
  | ActionApprovalRequestJsonObject
  | ActionApprovalRequestJsonValue[]

export interface ActionApprovalRequestJsonObject {
  [key: string]: ActionApprovalRequestJsonValue
}

export class ActionApprovalRequest {
  actionApprovalRequestId: number
  type: ActionApprovalRequestType
  status: ActionApprovalRequestStatus
  requesterUserId: number
  recipientUserId: number
  payload: ActionApprovalRequestJsonObject
  dedupKey: string
  actionTokenHash: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date

  activeDedupKey?: string
  cooldownUntil?: Date
  emailSentAt?: Date
  respondedAt?: Date

  constructor(data: {
    actionApprovalRequestId: number
    type: ActionApprovalRequestType
    status: ActionApprovalRequestStatus
    requesterUserId: number
    recipientUserId: number
    payload: ActionApprovalRequestJsonObject
    dedupKey: string
    actionTokenHash: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
    activeDedupKey?: string
    cooldownUntil?: Date
    emailSentAt?: Date
    respondedAt?: Date
  }) {
    this.actionApprovalRequestId = data.actionApprovalRequestId
    this.type = data.type
    this.status = data.status
    this.requesterUserId = data.requesterUserId
    this.recipientUserId = data.recipientUserId
    this.payload = data.payload
    this.dedupKey = data.dedupKey
    this.actionTokenHash = data.actionTokenHash
    this.expiresAt = data.expiresAt
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.activeDedupKey = data.activeDedupKey
    this.cooldownUntil = data.cooldownUntil
    this.emailSentAt = data.emailSentAt
    this.respondedAt = data.respondedAt
  }

  isPending(): boolean {
    return this.status === ActionApprovalRequestStatus.PENDING
  }

  isResolved(): boolean {
    return (
      this.status === ActionApprovalRequestStatus.ACCEPTED ||
      this.status === ActionApprovalRequestStatus.DECLINED ||
      this.status === ActionApprovalRequestStatus.CANCELED ||
      this.status === ActionApprovalRequestStatus.EXPIRED
    )
  }

  isExpired(now: Date): boolean {
    return now >= this.expiresAt
  }
}
