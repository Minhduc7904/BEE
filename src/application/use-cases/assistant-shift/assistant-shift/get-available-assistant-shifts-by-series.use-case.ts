import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftDateRangeQueryDto, AssistantShiftResponseDto, BaseResponseDto } from '../../../dtos'
import type { IMediaUsageRepository, IUnitOfWork } from '../../../../domain/repositories'
import { BusinessLogicException, NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../interfaces'
import { assistantShiftDetails, attachAssistantAvatarUrls } from './assistant-shift.use-case.helpers'
import { attachPendingExchangeRequestFlags } from './assistant-shift-pending-exchange-request.helper'

@Injectable()
export class GetAvailableAssistantShiftsBySeriesUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(seriesId: number, query: AssistantShiftDateRangeQueryDto) {
    const range = query.toRange()
    if (range.startAtFrom > range.startAtTo) throw new BusinessLogicException('Khoảng thời gian không hợp lệ')

    const result = await this.uow.executeInTransaction(async (repos) => {
      const series = await repos.assistantShiftSeriesRepository.findById(seriesId)
      if (!series) throw new NotFoundException('Chuỗi ca không tồn tại')
      if (series.isLocked) return { shifts: [], approvalRequests: [] }

      const [shifts, approvalRequests] = await Promise.all([
        repos.assistantShiftRepository.findAll({
          assistantShiftSeriesId: seriesId,
          ...range,
          onlyUnlocked: true,
          excludeBaseShifts: true,
          assignmentAttendanceStatus: query.attendanceStatus,
          ...assistantShiftDetails,
        }),
        repos.actionApprovalRequestRepository.findPendingAssistantShiftExchangeRequests(new Date()),
      ])

      return { shifts, approvalRequests }
    })

    const response = result.shifts.map((item) => new AssistantShiftResponseDto(item))
    attachPendingExchangeRequestFlags(response, result.approvalRequests)
    await attachAssistantAvatarUrls(response, this.mediaUsageRepository, this.minioService)
    return BaseResponseDto.success('Lấy danh sách ca thành công', response)
  }
}
