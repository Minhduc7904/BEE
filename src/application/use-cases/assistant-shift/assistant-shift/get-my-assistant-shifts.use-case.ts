import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftDateRangeQueryDto, AssistantShiftResponseDto, BaseResponseDto } from '../../../dtos'
import type { IMediaUsageRepository, IUnitOfWork } from '../../../../domain/repositories'
import { BusinessLogicException } from '../../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../interfaces'
import { attachAssistantAvatarUrls } from './assistant-shift.use-case.helpers'

@Injectable()
export class GetMyAssistantShiftsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(adminId: number, query: AssistantShiftDateRangeQueryDto) {
    const range = query.toRange()
    if (range.startAtFrom > range.startAtTo) throw new BusinessLogicException('Khoảng thời gian không hợp lệ')

    const data = await this.uow.executeInTransaction((repos) =>
      repos.assistantShiftRepository.findAll({
        ...range,
        assignedAdminId: adminId,
        excludeBaseShifts: true,
        includeAssignmentsForAdminId: adminId,
        assignmentAttendanceStatus: query.attendanceStatus,
        includeSeries: true,
        includeCourseClass: true,
      }),
    )

    const response = data.map((item) => new AssistantShiftResponseDto(item))
    await attachAssistantAvatarUrls(response, this.mediaUsageRepository, this.minioService)
    return BaseResponseDto.success('Lấy lịch trợ giảng của bạn thành công', response)
  }
}
