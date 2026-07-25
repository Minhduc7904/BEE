import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteAssistantShiftSeriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftSeriesId: number) {
    await this.uow.executeInTransaction(async (repos) => {
      if (!(await repos.assistantShiftSeriesRepository.findById(assistantShiftSeriesId))) {
        throw new NotFoundException('Chuỗi ca không tồn tại')
      }

      await repos.assistantShiftSeriesRepository.delete(assistantShiftSeriesId)
    })

    return BaseResponseDto.success('Xóa chuỗi ca thành công', { deleted: true })
  }
}
