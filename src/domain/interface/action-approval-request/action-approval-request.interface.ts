import { ActionApprovalRequestJsonObject } from '../../entities/action-approval-request'
import { ActionApprovalRequestStatus, ActionApprovalRequestType } from '../../../shared/enums'

export interface CreateActionApprovalRequestData {
  type: ActionApprovalRequestType
  requesterUserId: number
  recipientUserId: number
  payload: ActionApprovalRequestJsonObject
  activeDedupKey: string
  dedupKey: string
  actionTokenHash: string
  expiresAt: Date
}

export interface ActionApprovalRequestRateLimitOptions {
  userId: number
  since: Date
}

export interface ResolveActionApprovalRequestData {
  status: ActionApprovalRequestStatus
  respondedAt: Date
  cooldownUntil?: Date | null
}
