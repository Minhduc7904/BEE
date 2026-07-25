import type { ActionApprovalRequest } from '../../../../domain/entities/action-approval-request'
import { ActionApprovalRequestType } from '../../../../shared/enums'
import type { AssistantShiftResponseDto } from '../../../dtos'
import {
  DUPLICATE_COOLDOWN_MILLISECONDS,
  parseSwapApprovalPayload,
  parseTransferApprovalPayload,
} from '../assistant-shift-assignment/assistant-shift-assignment-action.use-case.helpers'

export function attachPendingExchangeRequestFlags(
  shifts: AssistantShiftResponseDto[],
  approvalRequests: ActionApprovalRequest[],
): void {
  const nextExchangeRequestAllowedAtByAssignmentKey = new Map<string, Date>()

  for (const approvalRequest of approvalRequests) {
    try {
      const nextExchangeRequestAllowedAt = new Date(
        approvalRequest.expiresAt.getTime() + DUPLICATE_COOLDOWN_MILLISECONDS,
      )

      if (approvalRequest.type === ActionApprovalRequestType.ASSISTANT_SHIFT_TRANSFER) {
        const payload = parseTransferApprovalPayload(approvalRequest.payload)
        setLatestAllowedAt(
          nextExchangeRequestAllowedAtByAssignmentKey,
          toAssignmentKey(payload.assistantShiftId, payload.sourceAdminId),
          nextExchangeRequestAllowedAt,
        )
      }

      if (approvalRequest.type === ActionApprovalRequestType.ASSISTANT_SHIFT_SWAP) {
        const payload = parseSwapApprovalPayload(approvalRequest.payload)
        setLatestAllowedAt(
          nextExchangeRequestAllowedAtByAssignmentKey,
          toAssignmentKey(payload.sourceAssistantShiftId, payload.sourceAdminId),
          nextExchangeRequestAllowedAt,
        )
        setLatestAllowedAt(
          nextExchangeRequestAllowedAtByAssignmentKey,
          toAssignmentKey(payload.targetAssistantShiftId, payload.targetAdminId),
          nextExchangeRequestAllowedAt,
        )
      }
    } catch {
      // Ignore invalid legacy payloads because this flag is only supplementary display data.
    }
  }

  for (const shift of shifts) {
    for (const assignment of shift.assignments ?? []) {
      const nextExchangeRequestAllowedAt = nextExchangeRequestAllowedAtByAssignmentKey.get(
        toAssignmentKey(assignment.assistantShiftId, assignment.adminId),
      )

      assignment.isPendingExchangeRequest = Boolean(nextExchangeRequestAllowedAt)
      assignment.nextExchangeRequestAllowedAt = nextExchangeRequestAllowedAt ?? null
    }
  }
}

function setLatestAllowedAt(
  nextExchangeRequestAllowedAtByAssignmentKey: Map<string, Date>,
  assignmentKey: string,
  nextExchangeRequestAllowedAt: Date,
): void {
  const current = nextExchangeRequestAllowedAtByAssignmentKey.get(assignmentKey)
  if (!current || current < nextExchangeRequestAllowedAt) {
    nextExchangeRequestAllowedAtByAssignmentKey.set(assignmentKey, nextExchangeRequestAllowedAt)
  }
}

function toAssignmentKey(assistantShiftId: number, adminId: number): string {
  return `${assistantShiftId}:${adminId}`
}
