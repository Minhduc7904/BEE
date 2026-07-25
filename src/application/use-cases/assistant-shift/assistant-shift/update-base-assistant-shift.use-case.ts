import { Inject, Injectable } from '@nestjs/common'

import { AssistantShiftResponseDto, BaseResponseDto, UpdateBaseAssistantShiftDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { BusinessLogicException, NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import {
  assertRange,
  createBaseShiftDate,
  getBaseShiftTime,
  getBaseShiftWeekday,
} from './assistant-shift.use-case.helpers'

@Injectable()
export class UpdateBaseAssistantShiftUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftId: number, dto: UpdateBaseAssistantShiftDto) {
    const item = await this.uow.executeInTransaction(async (repos) => {
      const current = await repos.assistantShiftRepository.findById(assistantShiftId)
      if (!current || !current.isBaseShift) {
        throw new NotFoundException('Ca cơ sở không tồn tại')
      }

      const weekday = getBaseShiftWeekday(current.startAt)
      const startAt = createBaseShiftDate(weekday, dto.startTime ?? getBaseShiftTime(current.startAt))
      const endAt = createBaseShiftDate(weekday, dto.endTime ?? getBaseShiftTime(current.endAt))
      assertRange(startAt, endAt)

      if (
        (startAt.getTime() !== current.startAt.getTime() || endAt.getTime() !== current.endAt.getTime()) &&
        (await repos.assistantShiftRepository.hasOverlappingTimeRange(
          current.assistantShiftSeriesId,
          startAt,
          endAt,
          current.assistantShiftId,
        ))
      ) {
        throw new BusinessLogicException('Khoảng thời gian đã có ca trợ giảng')
      }

      return repos.assistantShiftRepository.update(assistantShiftId, {
        classId: dto.classId,
        name: dto.name,
        notes: dto.notes,
        requiredAssistantCount: dto.requiredAssistantCount,
        startAt,
        endAt,
      })
    })

    return BaseResponseDto.success('Cập nhật ca cơ sở thành công', new AssistantShiftResponseDto(item))
  }
}
