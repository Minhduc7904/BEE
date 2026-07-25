import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { BaseResponseDto, CreateAssistantShiftSwapRequestDto } from '../../../dtos'
import { AssistantShiftAssignmentExchangeEmailServicePort } from '../../../interfaces'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { ActionApprovalRequestType } from '../../../../shared/enums'
import { BusinessLogicException, ConflictException } from '../../../../shared/exceptions/custom-exceptions'
import { assertEligibleAssistant } from '../assistant-shift/assistant-shift.use-case.helpers'
import {
  assertActionApprovalCreationAllowed,
  assertPendingAssignment,
  assertShiftNotEnded,
  createActionApprovalDedupKey,
  createActionApprovalToken,
  getActionApprovalExpiry,
  hashActionApprovalValue,
} from './assistant-shift-assignment-action.use-case.helpers'

@Injectable()
export class RequestAssistantShiftSwapUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject(AssistantShiftAssignmentExchangeEmailServicePort)
    private readonly emailService: AssistantShiftAssignmentExchangeEmailServicePort,
  ) {}

  async execute(adminId: number, dto: CreateAssistantShiftSwapRequestDto) {
    const request = await this.uow.executeInTransaction(
      async (repos) => {
        if (dto.targetAdminId === adminId || dto.targetAssistantShiftId === dto.myAssistantShiftId) {
          throw new ConflictException('Chỉ có thể đổi với assignment thuộc ca và trợ giảng khác')
        }

        const [sourceAssignment, targetAssignment, sourceShift, targetShift] = await Promise.all([
          repos.assistantShiftAssignmentRepository.findById(dto.myAssistantShiftId, adminId),
          repos.assistantShiftAssignmentRepository.findById(dto.targetAssistantShiftId, dto.targetAdminId),
          repos.assistantShiftRepository.findById(dto.myAssistantShiftId, { includeSeries: true }),
          repos.assistantShiftRepository.findById(dto.targetAssistantShiftId, { includeSeries: true }),
        ])
        assertPendingAssignment(sourceAssignment, 'Assignment của bạn không còn ở trạng thái chờ')
        assertPendingAssignment(targetAssignment, 'Assignment muốn đổi không còn ở trạng thái chờ')
        assertShiftNotEnded(sourceShift)
        assertShiftNotEnded(targetShift)

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
          throw new ConflictException('Một trong hai trợ giảng đã được phân công vào ca muốn đổi')
        }

        const [requester, recipient] = await Promise.all([
          assertEligibleAssistant(adminId, repos.adminRepository),
          assertEligibleAssistant(dto.targetAdminId, repos.adminRepository),
        ])
        const recipientEmail = recipient.getEmail()?.trim()
        if (!recipient.isActive() || !recipientEmail) {
          throw new BusinessLogicException('Trợ giảng muốn đổi ca chưa có email hoạt động')
        }

        const payload = {
          version: 1 as const,
          sourceAssistantShiftId: sourceAssignment.assistantShiftId,
          sourceAdminId: sourceAssignment.adminId,
          targetAssistantShiftId: targetAssignment.assistantShiftId,
          targetAdminId: targetAssignment.adminId,
        }
        const dedupKey = createActionApprovalDedupKey(ActionApprovalRequestType.ASSISTANT_SHIFT_SWAP, payload)
        await assertActionApprovalCreationAllowed(repos, requester.userId, recipient.userId, dedupKey)

        const actionToken = createActionApprovalToken()
        const approvalRequest = await repos.actionApprovalRequestRepository.create({
          type: ActionApprovalRequestType.ASSISTANT_SHIFT_SWAP,
          requesterUserId: requester.userId,
          recipientUserId: recipient.userId,
          payload,
          activeDedupKey: dedupKey,
          dedupKey,
          actionTokenHash: hashActionApprovalValue(actionToken),
          expiresAt: getActionApprovalExpiry(sourceShift, targetShift),
        })

        return {
          actionApprovalRequestId: approvalRequest.actionApprovalRequestId,
          actionToken,
          recipientEmail,
          recipientName: recipient.getFullName(),
          requesterName: requester.getFullName(),
          sourceShiftName: sourceShift.name,
          sourceStartAt: sourceShift.startAt,
          sourceEndAt: sourceShift.endAt,
          targetShiftName: targetShift.name,
          targetStartAt: targetShift.startAt,
          targetEndAt: targetShift.endAt,
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    try {
      await this.emailService.sendSwapRequest(request)
    } catch {
      await this.uow.executeInTransaction((repos) =>
        repos.actionApprovalRequestRepository.cancelPending(request.actionApprovalRequestId, new Date()),
      )
      throw new BusinessLogicException('Không thể gửi email đề nghị đổi ca. Vui lòng thử lại')
    }

    try {
      await this.uow.executeInTransaction((repos) =>
        repos.actionApprovalRequestRepository.markEmailSent(request.actionApprovalRequestId, new Date()),
      )
    } catch {
      // Email đã gửi thành công; metadata này không được làm hỏng đề nghị đang chờ phản hồi.
    }

    return BaseResponseDto.success('Đã gửi email đề nghị đổi ca', {
      sent: true,
      actionApprovalRequestId: request.actionApprovalRequestId,
    })
  }
}
