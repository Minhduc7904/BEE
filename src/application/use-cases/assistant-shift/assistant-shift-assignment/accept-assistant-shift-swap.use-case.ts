import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { AssistantShiftAssignmentExchangeEmailServicePort } from '../../../interfaces'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { ActionApprovalRequestStatus, ActionApprovalRequestType } from '../../../../shared/enums'
import { BusinessLogicException, ConflictException } from '../../../../shared/exceptions/custom-exceptions'
import {
  AssistantShiftAssignmentActionPageResult,
  assertPendingAssignment,
  assertRequestOwners,
  assertShiftNotEnded,
  claimActionApprovalRequest,
  parseSwapApprovalPayload,
  toActionPageResult,
} from './assistant-shift-assignment-action.use-case.helpers'

@Injectable()
export class AcceptAssistantShiftSwapUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject(AssistantShiftAssignmentExchangeEmailServicePort)
    private readonly emailService: AssistantShiftAssignmentExchangeEmailServicePort,
  ) {}

  async execute(actionToken: string): Promise<AssistantShiftAssignmentActionPageResult> {
    try {
      const successEmailRequests = await this.uow.executeInTransaction(
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

          const [sourceTargetConflict, targetSourceConflict] = await Promise.all([
            repos.assistantShiftAssignmentRepository.findById(
              targetAssignment.assistantShiftId,
              sourceAssignment.adminId,
            ),
            repos.assistantShiftAssignmentRepository.findById(
              sourceAssignment.assistantShiftId,
              targetAssignment.adminId,
            ),
          ])
          if (sourceTargetConflict || targetSourceConflict) {
            throw new ConflictException('Một trong hai trợ giảng đã được phân công vào ca đích')
          }

          await repos.assistantShiftAssignmentRepository.swapAssistantShifts(
            sourceAssignment.assistantShiftId,
            sourceAssignment.adminId,
            targetAssignment.assistantShiftId,
            targetAssignment.adminId,
          )
          await repos.actionApprovalRequestRepository.resolveProcessing(request.actionApprovalRequestId, {
            status: ActionApprovalRequestStatus.ACCEPTED,
            respondedAt: new Date(),
          })

          return [
            {
              recipientEmail: requester.getEmail()?.trim() ?? '',
              recipientName: requester.getFullName(),
              counterpartName: recipient.getFullName(),
              action: 'swap' as const,
              recipientRole: 'requester' as const,
              shiftName: targetShift.name,
              startAt: targetShift.startAt,
              endAt: targetShift.endAt,
            },
            {
              recipientEmail: recipient.getEmail()?.trim() ?? '',
              recipientName: recipient.getFullName(),
              counterpartName: requester.getFullName(),
              action: 'swap' as const,
              recipientRole: 'recipient' as const,
              shiftName: sourceShift.name,
              startAt: sourceShift.startAt,
              endAt: sourceShift.endAt,
            },
          ]
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )

      await Promise.allSettled(
        successEmailRequests
          .filter(({ recipientEmail }) => Boolean(recipientEmail))
          .map((input) => this.emailService.sendRequestAccepted(input)),
      )

      return { success: true, message: 'Đổi ca thành công.' }
    } catch (error) {
      return toActionPageResult(error)
    }
  }
}
