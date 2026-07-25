import type { ActionApprovalRequest as PrismaActionApprovalRequest } from '@prisma/client'

import {
  ActionApprovalRequest,
  ActionApprovalRequestJsonObject,
} from '../../../domain/entities/action-approval-request'
import { ActionApprovalRequestStatus, ActionApprovalRequestType } from '../../../shared/enums'

export class ActionApprovalRequestMapper {
  static toDomain(record: PrismaActionApprovalRequest | null | undefined): ActionApprovalRequest | null {
    if (!record) return null

    return new ActionApprovalRequest({
      actionApprovalRequestId: record.actionApprovalRequestId,
      type: record.type as ActionApprovalRequestType,
      status: record.status as ActionApprovalRequestStatus,
      requesterUserId: record.requesterUserId,
      recipientUserId: record.recipientUserId,
      payload: record.payload as ActionApprovalRequestJsonObject,
      activeDedupKey: record.activeDedupKey ?? undefined,
      dedupKey: record.dedupKey,
      actionTokenHash: record.actionTokenHash,
      expiresAt: record.expiresAt,
      cooldownUntil: record.cooldownUntil ?? undefined,
      emailSentAt: record.emailSentAt ?? undefined,
      respondedAt: record.respondedAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
