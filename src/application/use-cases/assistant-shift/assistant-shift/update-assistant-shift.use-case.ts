import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftResponseDto, BaseResponseDto, UpdateAssistantShiftDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { assertRange, assertSelfRegistrationWindow } from './assistant-shift.use-case.helpers'

@Injectable()
export class UpdateAssistantShiftUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftId: number, dto: UpdateAssistantShiftDto) {
    const item = await this.uow.executeInTransaction(async (repos) => {
      const current = await repos.assistantShiftRepository.findById(assistantShiftId)
      if (!current) throw new NotFoundException('Ca trợ giảng không tồn tại')
      if (current.isBaseShift) throw new NotFoundException('Ca trợ giảng không tồn tại')

      if (
        dto.assistantShiftSeriesId &&
        !(await repos.assistantShiftSeriesRepository.findById(dto.assistantShiftSeriesId))
      ) {
        throw new NotFoundException('Chuỗi ca không tồn tại')
      }

      const startAt = dto.startAt ? new Date(dto.startAt) : current.startAt
      const endAt = dto.endAt ? new Date(dto.endAt) : current.endAt
      assertRange(startAt, endAt)
      const hasOpenAt = Object.hasOwn(dto, 'selfRegistrationOpenAt')
      const hasCloseAt = Object.hasOwn(dto, 'selfRegistrationCloseAt')
      const selfRegistrationOpenAt = hasOpenAt
        ? dto.selfRegistrationOpenAt
          ? new Date(dto.selfRegistrationOpenAt)
          : null
        : current.selfRegistrationOpenAt
      const selfRegistrationCloseAt = hasCloseAt
        ? dto.selfRegistrationCloseAt
          ? new Date(dto.selfRegistrationCloseAt)
          : null
        : current.selfRegistrationCloseAt
      assertSelfRegistrationWindow(selfRegistrationOpenAt, selfRegistrationCloseAt)

      return repos.assistantShiftRepository.update(assistantShiftId, {
        ...dto,
        startAt,
        endAt,
        selfRegistrationOpenAt: hasOpenAt ? selfRegistrationOpenAt : undefined,
        selfRegistrationCloseAt: hasCloseAt ? selfRegistrationCloseAt : undefined,
      })
    })

    return BaseResponseDto.success('Cập nhật ca thành công', new AssistantShiftResponseDto(item))
  }
}
