import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftSeriesResponseDto, BaseResponseDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'

@Injectable()
export class GetAllAssistantShiftSeriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute() {
    const data = await this.uow.executeInTransaction((repos) => repos.assistantShiftSeriesRepository.findAll())

    return BaseResponseDto.success(
      'Lấy tất cả chuỗi ca thành công',
      data.map((item) => new AssistantShiftSeriesResponseDto(item)),
    )
  }
}
