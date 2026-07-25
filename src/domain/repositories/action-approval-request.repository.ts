import { ActionApprovalRequest } from '../entities/action-approval-request'
import { CreateActionApprovalRequestData, ResolveActionApprovalRequestData } from '../interface/action-approval-request'

export interface IActionApprovalRequestRepository {
  create(data: CreateActionApprovalRequestData): Promise<ActionApprovalRequest>
  findById(id: number): Promise<ActionApprovalRequest | null>
  findByActionTokenHash(tokenHash: string): Promise<ActionApprovalRequest | null>
  findByActiveDedupKey(activeDedupKey: string): Promise<ActionApprovalRequest | null>
  findLatestByDedupKey(dedupKey: string): Promise<ActionApprovalRequest | null>
  findPendingAssistantShiftExchangeRequests(now: Date): Promise<ActionApprovalRequest[]>
  countCreatedByRequesterSince(requesterUserId: number, since: Date): Promise<number>
  countCreatedByRecipientSince(recipientUserId: number, since: Date): Promise<number>
  claimPending(id: number, now: Date): Promise<boolean>
  resolveProcessing(id: number, data: ResolveActionApprovalRequestData): Promise<void>
  expirePending(id: number, now: Date, cooldownUntil: Date): Promise<boolean>
  cancelPending(id: number, respondedAt: Date): Promise<boolean>
  markEmailSent(id: number, sentAt: Date): Promise<void>
}
