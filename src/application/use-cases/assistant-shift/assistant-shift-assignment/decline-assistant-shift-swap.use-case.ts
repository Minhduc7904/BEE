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
  parseSwapApprovalPayload,
  toActionPageResult,
} from './assistant-shift-assignment-action.use-case.helpers'

@Injectable()
export class DeclineAssistantShiftSwapUseCase {
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
            ActionApprovalRequestType.ASSISTANT_SHIFT_SWAP,
          )
          const payload = parseSwapApprovalPayload(request.payload)
          const [sourceAssignment, targetAssignment, sourceShift, targetShift, requester, recipient] =
            await Promise.all([
              repos.assistantShiftAssignmentRepository.findById(payload.sourceAssistantShiftId, payload.sourceAdminId),
              repos.assistantShiftAssignmentRepository.findById(payload.targetAssistantShiftId, payload.targetAdminId),
              repos.assistantShiftRepository.findById(payload.sourceAssistantShiftId, { includeSeries: true }),
              repos.assistantShiftRepository.findById(payload.targetAssistantShiftId, { includeSeries: true }),
              repos.adminRepository.findById(payload.sourceAdminId),
              repos.adminRepository.findById(payload.targetAdminId),
            ])
          assertPendingAssignment(sourceAssignment, 'Đề nghị đổi ca không còn hợp lệ')
          assertPendingAssignment(targetAssignment, 'Đề nghị đổi ca không còn hợp lệ')
          assertShiftNotEnded(sourceShift)
          assertShiftNotEnded(targetShift)
          if (!requester || !recipient) {
            throw new BusinessLogicException('Đề nghị đổi ca không còn hợp lệ')
          }
          assertRequestOwners(request, requester.userId, recipient.userId)

          const now = new Date()
          await repos.actionApprovalRequestRepository.resolveProcessing(request.actionApprovalRequestId, {
            status: ActionApprovalRequestStatus.DECLINED,
            respondedAt: now,
            cooldownUntil: new Date(now.getTime() + DECLINED_REQUEST_COOLDOWN_MILLISECONDS),
          })

          const requesterEmail = requester.getEmail()?.trim()
          if (!requesterEmail) {
            throw new BusinessLogicException('Người gửi đề nghị chưa có email hợp lệ')
          }

          return {
            requesterEmail,
            requesterName: requester.getFullName(),
            recipientName: recipient.getFullName(),
            action: 'đổi ca' as const,
            shiftName: targetShift.name,
            startAt: targetShift.startAt,
            endAt: targetShift.endAt,
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )

      await this.emailService.sendRequestDeclined(notification)
      return { success: true, message: 'Bạn đã từ chối đề nghị đổi ca.' }
    } catch (error) {
      return toActionPageResult(error)
    }
  }
}
