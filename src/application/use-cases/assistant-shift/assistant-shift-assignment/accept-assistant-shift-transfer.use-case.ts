import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import type { IUnitOfWork } from '../../../../domain/repositories'
import { ActionApprovalRequestStatus, ActionApprovalRequestType } from '../../../../shared/enums'
import { BusinessLogicException, ConflictException } from '../../../../shared/exceptions/custom-exceptions'
import { assertEligibleAssistant } from '../assistant-shift/assistant-shift.use-case.helpers'
import {
  AssistantShiftAssignmentActionPageResult,
  assertPendingAssignment,
  assertRequestOwners,
  assertShiftNotEnded,
  claimActionApprovalRequest,
  parseTransferApprovalPayload,
  toActionPageResult,
} from './assistant-shift-assignment-action.use-case.helpers'

@Injectable()
export class AcceptAssistantShiftTransferUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(actionToken: string): Promise<AssistantShiftAssignmentActionPageResult> {
    try {
      await this.uow.executeInTransaction(
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
            assertEligibleAssistant(payload.targetAdminId, repos.adminRepository),
          ])
          assertPendingAssignment(sourceAssignment, 'Đề nghị nhường ca không còn hợp lệ')
          assertShiftNotEnded(shift)
          if (!requester || sourceAssignment.adminId === recipient.adminId) {
            throw new BusinessLogicException('Đề nghị nhường ca không còn hợp lệ')
          }
          assertRequestOwners(request, requester.userId, recipient.userId)
          if (!recipient.isActive()) {
            throw new BusinessLogicException('Trợ giảng nhận ca không còn hoạt động')
          }
          if (
            await repos.assistantShiftAssignmentRepository.findById(
              sourceAssignment.assistantShiftId,
              recipient.adminId,
            )
          ) {
            throw new ConflictException('Trợ giảng này đã được phân công vào ca')
          }

          await repos.assistantShiftAssignmentRepository.transferAssignment(
            sourceAssignment.assistantShiftId,
            sourceAssignment.adminId,
            recipient.adminId,
          )
          await repos.actionApprovalRequestRepository.resolveProcessing(request.actionApprovalRequestId, {
            status: ActionApprovalRequestStatus.ACCEPTED,
            respondedAt: new Date(),
          })
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )

      return { success: true, message: 'Bạn đã nhận ca thành công.' }
    } catch (error) {
      return toActionPageResult(error)
    }
  }
}
