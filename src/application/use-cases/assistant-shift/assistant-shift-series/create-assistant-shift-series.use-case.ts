import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftSeriesResponseDto, BaseResponseDto, CreateAssistantShiftSeriesDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'

@Injectable()
export class CreateAssistantShiftSeriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(dto: CreateAssistantShiftSeriesDto) {
    const item = await this.uow.executeInTransaction((repos) => repos.assistantShiftSeriesRepository.create(dto))
    return BaseResponseDto.success('Tạo chuỗi ca thành công', new AssistantShiftSeriesResponseDto(item))
  }
}
