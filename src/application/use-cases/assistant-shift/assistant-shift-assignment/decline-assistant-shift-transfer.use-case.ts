import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { AssistantShiftAssignmentExchangeEmailServicePort } from '../../../interfaces'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { ActionApprovalRequestStatus, ActionApprovalRequestType } from '../../../../shared/enums'
import { BusinessLogicException } from '../../../../shared/exceptions/custom-exceptions'
import {
  AssistantShiftAssignmentActionPageResult,
  assertPendingAssignment,
  assertRequestOwners,
  assertShiftNotEnded,
  claimActionApprovalRequest,
  DECLINED_REQUEST_COOLDOWN_MILLISECONDS,
  parseTransferApprovalPayload,
  toActionPageResult,
} from './assistant-shift-assignment-action.use-case.helpers'

@Injectable()
export class DeclineAssistantShiftTransferUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject(AssistantShiftAssignmentExchangeEmailServicePort)
    private readonly emailService: AssistantShiftAssignmentExchangeEmailServicePort,
  ) {}

  async execute(actionToken: string): Promise<AssistantShiftAssignmentActionPageResult> {
    try {
      const notification = await this.uow.executeInTransaction(
        async (repos) => {
          const request = await claimActionApprovalRequest(
            repos,
            actionToken,
            ActionApprovalRequestType.ASSISTANT_SHIFT_TRANSFER,
          )
          const payload = parseTransferApprovalPayload(request.payload)
          const [sourceAssignment, shift, requester, recipient] = await Promise.all([
            repos.assistantShiftAssignmentRepository.findById(payload.assistantShiftId, payload.sourceAdminId),
            repos.assistantShiftRepository.findById(payload.assistantShiftId, { includeSeries: true }),
            repos.adminRepository.findById(payload.sourceAdminId),
            repos.adminRepository.findById(payload.targetAdminId),
          ])
          assertPendingAssignment(sourceAssignment, 'Đề nghị nhường ca không còn hợp lệ')
          assertShiftNotEnded(shift)
          if (!requester || !recipient || sourceAssignment.adminId === recipient.adminId) {
            throw new BusinessLogicException('Đề nghị nhường ca không còn hợp lệ')
          }
          assertRequestOwners(request, requester.userId, recipient.userId)

          const requesterEmail = requester.getEmail()?.trim()
          if (!requesterEmail) {
            throw new BusinessLogicException('Người gửi đề nghị chưa có email hợp lệ')
          }

          const now = new Date()
          await repos.actionApprovalRequestRepository.resolveProcessing(request.actionApprovalRequestId, {
            status: ActionApprovalRequestStatus.DECLINED,
            respondedAt: now,
            cooldownUntil: new Date(now.getTime() + DECLINED_REQUEST_COOLDOWN_MILLISECONDS),
          })

          return {
            requesterEmail,
            requesterName: requester.getFullName(),
            recipientName: recipient.getFullName(),
            action: 'nhường ca' as const,
            shiftName: shift.name,
            startAt: shift.startAt,
            endAt: shift.endAt,
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )

      await this.emailService.sendRequestDeclined(notification)
      return { success: true, message: 'Bạn đã từ chối đề nghị nhường ca.' }
    } catch (error) {
      return toActionPageResult(error)
    }
  }
}
