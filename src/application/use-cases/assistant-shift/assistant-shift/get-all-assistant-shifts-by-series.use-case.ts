import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftAllBySeriesQueryDto, AssistantShiftResponseDto, BaseResponseDto } from '../../../dtos'
import type { IMediaUsageRepository, IUnitOfWork } from '../../../../domain/repositories'
import { BusinessLogicException, NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../interfaces'
import { assistantShiftDetails, attachAssistantAvatarUrls } from './assistant-shift.use-case.helpers'

@Injectable()
export class GetAllAssistantShiftsBySeriesUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(query: AssistantShiftAllBySeriesQueryDto) {
    const range = query.toRange()
    if (range.startAtFrom > range.startAtTo) throw new BusinessLogicException('Khoảng thời gian không hợp lệ')
    if (query.assistantShiftSeriesIds.length === 0) {
      throw new BusinessLogicException('Phải chọn ít nhất một chuỗi ca')
    }
    if (new Set(query.assistantShiftSeriesIds).size !== query.assistantShiftSeriesIds.length) {
      throw new BusinessLogicException('Danh sách ID chuỗi ca không được trùng lặp')
    }

    const data = await this.uow.executeInTransaction(async (repos) => {
      const series = await Promise.all(
        query.assistantShiftSeriesIds.map((assistantShiftSeriesId) =>
          repos.assistantShiftSeriesRepository.findById(assistantShiftSeriesId),
        ),
      )
      if (series.some((item) => !item)) {
        throw new NotFoundException('Một hoặc nhiều chuỗi ca không tồn tại')
      }

      return repos.assistantShiftRepository.findAll({
        assistantShiftSeriesIds: query.assistantShiftSeriesIds,
        ...range,
        excludeBaseShifts: true,
        assignedAdminId: query.adminId,
        assignmentAttendanceStatus: query.attendanceStatus,
        ...assistantShiftDetails,
      })
    })

    const response = data.map((item) => new AssistantShiftResponseDto(item))
    await attachAssistantAvatarUrls(response, this.mediaUsageRepository, this.minioService)
    return BaseResponseDto.success('Lấy danh sách ca thành công', response)
  }
}
