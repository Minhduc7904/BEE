import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftAssignmentStatusQueryDto, AssistantShiftResponseDto, BaseResponseDto } from '../../../dtos'
import type { IMediaUsageRepository, IUnitOfWork } from '../../../../domain/repositories'
import { MinioService } from '../../../interfaces'
import {
  assertAssistantShiftAvailableToAssistant,
  assistantShiftDetails,
  attachAssistantAvatarUrls,
} from './assistant-shift.use-case.helpers'
import { attachPendingExchangeRequestFlags } from './assistant-shift-pending-exchange-request.helper'

@Injectable()
export class GetAvailableAssistantShiftUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(assistantShiftId: number, query: AssistantShiftAssignmentStatusQueryDto) {
    const result = await this.uow.executeInTransaction(async (repos) => {
      const [shift, approvalRequests] = await Promise.all([
        repos.assistantShiftRepository.findById(assistantShiftId, {
          ...assistantShiftDetails,
          assignmentAttendanceStatus: query.attendanceStatus,
        }),
        repos.actionApprovalRequestRepository.findPendingAssistantShiftExchangeRequests(new Date()),
      ])

      return { shift, approvalRequests }
    })
    assertAssistantShiftAvailableToAssistant(result.shift)

    const response = new AssistantShiftResponseDto(result.shift)
    attachPendingExchangeRequestFlags([response], result.approvalRequests)
    await attachAssistantAvatarUrls([response], this.mediaUsageRepository, this.minioService)
    return BaseResponseDto.success('Lấy chi tiết ca thành công', response)
  }
}
