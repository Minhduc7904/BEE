import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { BaseResponseDto, CreateAssistantShiftTransferRequestDto } from '../../../dtos'
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
export class RequestAssistantShiftTransferUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject(AssistantShiftAssignmentExchangeEmailServicePort)
    private readonly emailService: AssistantShiftAssignmentExchangeEmailServicePort,
  ) {}

  async execute(adminId: number, dto: CreateAssistantShiftTransferRequestDto) {
    const request = await this.uow.executeInTransaction(
      async (repos) => {
        if (dto.targetAdminId === adminId) {
          throw new ConflictException('Không thể nhường ca cho chính mình')
        }

        const [sourceAssignment, shift] = await Promise.all([
          repos.assistantShiftAssignmentRepository.findById(dto.assistantShiftId, adminId),
          repos.assistantShiftRepository.findById(dto.assistantShiftId, { includeSeries: true }),
        ])
        assertPendingAssignment(sourceAssignment, 'Assignment của bạn không còn ở trạng thái chờ')
        assertShiftNotEnded(shift)

        if (await repos.assistantShiftAssignmentRepository.findById(dto.assistantShiftId, dto.targetAdminId)) {
          throw new ConflictException('Trợ giảng này đã được phân công vào ca')
        }

        const [requester, recipient] = await Promise.all([
          assertEligibleAssistant(adminId, repos.adminRepository),
          assertEligibleAssistant(dto.targetAdminId, repos.adminRepository),
        ])
        const recipientEmail = recipient.getEmail()?.trim()
        if (!recipient.isActive() || !recipientEmail) {
          throw new BusinessLogicException('Trợ giảng nhận ca chưa có email hoạt động')
        }

        const payload = {
          version: 1 as const,
          assistantShiftId: sourceAssignment.assistantShiftId,
          sourceAdminId: sourceAssignment.adminId,
          targetAdminId: recipient.adminId,
        }
        const dedupKey = createActionApprovalDedupKey(ActionApprovalRequestType.ASSISTANT_SHIFT_TRANSFER, payload)
        await assertActionApprovalCreationAllowed(repos, requester.userId, recipient.userId, dedupKey)

        const actionToken = createActionApprovalToken()
        const approvalRequest = await repos.actionApprovalRequestRepository.create({
          type: ActionApprovalRequestType.ASSISTANT_SHIFT_TRANSFER,
          requesterUserId: requester.userId,
          recipientUserId: recipient.userId,
          payload,
          activeDedupKey: dedupKey,
          dedupKey,
          actionTokenHash: hashActionApprovalValue(actionToken),
          expiresAt: getActionApprovalExpiry(shift),
        })

        return {
          actionApprovalRequestId: approvalRequest.actionApprovalRequestId,
          actionToken,
          recipientEmail,
          recipientName: recipient.getFullName(),
          requesterName: requester.getFullName(),
          shiftName: shift.name,
          startAt: shift.startAt,
          endAt: shift.endAt,
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    try {
      await this.emailService.sendTransferRequest(request)
    } catch {
      await this.uow.executeInTransaction((repos) =>
        repos.actionApprovalRequestRepository.cancelPending(request.actionApprovalRequestId, new Date()),
      )
      throw new BusinessLogicException('Không thể gửi email đề nghị nhường ca. Vui lòng thử lại')
    }

    try {
      await this.uow.executeInTransaction((repos) =>
        repos.actionApprovalRequestRepository.markEmailSent(request.actionApprovalRequestId, new Date()),
      )
    } catch {
      // Email đã gửi thành công; metadata này không được làm hỏng đề nghị đang chờ phản hồi.
    }

    return BaseResponseDto.success('Đã gửi email đề nghị nhường ca', {
      sent: true,
      actionApprovalRequestId: request.actionApprovalRequestId,
    })
  }
}
