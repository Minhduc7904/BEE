import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftSeriesResponseDto, BaseResponseDto, UpdateAssistantShiftSeriesDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateAssistantShiftSeriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftSeriesId: number, dto: UpdateAssistantShiftSeriesDto) {
    const item = await this.uow.executeInTransaction(async (repos) => {
      if (!(await repos.assistantShiftSeriesRepository.findById(assistantShiftSeriesId))) {
        throw new NotFoundException('Chuỗi ca không tồn tại')
      }

      return repos.assistantShiftSeriesRepository.update(assistantShiftSeriesId, dto)
    })

    return BaseResponseDto.success('Cập nhật chuỗi ca thành công', new AssistantShiftSeriesResponseDto(item))
  }
}
