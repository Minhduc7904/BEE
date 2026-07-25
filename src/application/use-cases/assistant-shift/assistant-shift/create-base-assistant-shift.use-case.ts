import { Inject, Injectable } from '@nestjs/common'

import { AssistantShiftResponseDto, BaseResponseDto, CreateBaseAssistantShiftDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { BusinessLogicException, NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { assertRange, createBaseShiftDate } from './assistant-shift.use-case.helpers'

@Injectable()
export class CreateBaseAssistantShiftUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftSeriesId: number, dto: CreateBaseAssistantShiftDto) {
    const item = await this.uow.executeInTransaction(async (repos) => {
      if (!(await repos.assistantShiftSeriesRepository.findById(assistantShiftSeriesId))) {
        throw new NotFoundException('Chuỗi ca không tồn tại')
      }

      const startAt = createBaseShiftDate(dto.weekday, dto.startTime)
      const endAt = createBaseShiftDate(dto.weekday, dto.endTime)
      assertRange(startAt, endAt)

      if (await repos.assistantShiftRepository.hasOverlappingTimeRange(assistantShiftSeriesId, startAt, endAt)) {
        throw new BusinessLogicException('Khoảng thời gian đã có ca trợ giảng')
      }

      return repos.assistantShiftRepository.create({
        assistantShiftSeriesId,
        classId: dto.classId ?? null,
        name: dto.name,
        notes: dto.notes ?? null,
        startAt,
        endAt,
        requiredAssistantCount: dto.requiredAssistantCount,
        isBaseShift: true,
        isLocked: false,
        selfRegistrationOpenAt: null,
        selfRegistrationCloseAt: null,
      })
    })

    return BaseResponseDto.success('Tạo ca cơ sở thành công', new AssistantShiftResponseDto(item))
  }
}
