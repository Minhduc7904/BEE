import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftAssignmentStatusQueryDto, AssistantShiftResponseDto, BaseResponseDto } from '../../../dtos'
import type { IMediaUsageRepository, IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../interfaces'
import { assistantShiftDetails, attachAssistantAvatarUrls } from './assistant-shift.use-case.helpers'

@Injectable()
export class GetAssistantShiftUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(assistantShiftId: number, query: AssistantShiftAssignmentStatusQueryDto) {
    const shift = await this.uow.executeInTransaction((repos) =>
      repos.assistantShiftRepository.findById(assistantShiftId, {
        ...assistantShiftDetails,
        assignmentAttendanceStatus: query.attendanceStatus,
      }),
    )
    if (!shift) throw new NotFoundException('Ca trợ giảng không tồn tại')

    const response = new AssistantShiftResponseDto(shift)
    await attachAssistantAvatarUrls([response], this.mediaUsageRepository, this.minioService)
    return BaseResponseDto.success('Lấy chi tiết ca thành công', response)
  }
}
