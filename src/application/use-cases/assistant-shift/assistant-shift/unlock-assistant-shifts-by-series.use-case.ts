import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftRangeDto, BaseResponseDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { toDateRange } from './assistant-shift.use-case.helpers'

@Injectable()
export class UnlockAssistantShiftsBySeriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftSeriesId: number, dto: AssistantShiftRangeDto) {
    const { startAt, endAt } = toDateRange(dto)
    const updatedCount = await this.uow.executeInTransaction(async (repos) => {
      if (!(await repos.assistantShiftSeriesRepository.findById(assistantShiftSeriesId))) {
        throw new NotFoundException('Chuỗi ca không tồn tại')
      }

      return repos.assistantShiftRepository.updateBySeriesAndStartAtRange(assistantShiftSeriesId, startAt, endAt, {
        isLocked: false,
      })
    })

    return BaseResponseDto.success('Mở khóa các ca trợ giảng thành công', { updatedCount })
  }
}
