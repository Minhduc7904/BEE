import { Inject, Injectable } from '@nestjs/common'

import { AssistantShiftBaseListQueryDto, AssistantShiftResponseDto, BaseResponseDto } from '../../../dtos'
import type { IMediaUsageRepository, IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../interfaces'
import { assistantShiftDetails, attachAssistantAvatarUrls } from './assistant-shift.use-case.helpers'

@Injectable()
export class GetBaseAssistantShiftsBySeriesUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(assistantShiftSeriesId: number, query: AssistantShiftBaseListQueryDto) {
    const data = await this.uow.executeInTransaction(async (repos) => {
      if (!(await repos.assistantShiftSeriesRepository.findById(assistantShiftSeriesId))) {
        throw new NotFoundException('Chuỗi ca không tồn tại')
      }

      return repos.assistantShiftRepository.findAll({
        assistantShiftSeriesId,
        onlyBaseShifts: true,
        assignedAdminId: query.adminId,
        ...assistantShiftDetails,
      })
    })

    const response = data.map((item) => new AssistantShiftResponseDto(item))
    await attachAssistantAvatarUrls(response, this.mediaUsageRepository, this.minioService)
    return BaseResponseDto.success('Lấy danh sách ca cơ sở thành công', response)
  }
}
