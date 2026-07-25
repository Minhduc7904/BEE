import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, SetAssistantShiftSelfRegistrationWindowDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { assertSelfRegistrationWindow, toDateRange } from './assistant-shift.use-case.helpers'

@Injectable()
export class SetAssistantShiftSelfRegistrationWindowBySeriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftSeriesId: number, dto: SetAssistantShiftSelfRegistrationWindowDto) {
    const { startAt, endAt } = toDateRange(dto)
    const selfRegistrationOpenAt = dto.selfRegistrationOpenAt ? new Date(dto.selfRegistrationOpenAt) : null
    const selfRegistrationCloseAt = dto.selfRegistrationCloseAt ? new Date(dto.selfRegistrationCloseAt) : null
    assertSelfRegistrationWindow(selfRegistrationOpenAt, selfRegistrationCloseAt)

    const updatedCount = await this.uow.executeInTransaction(async (repos) => {
      if (!(await repos.assistantShiftSeriesRepository.findById(assistantShiftSeriesId))) {
        throw new NotFoundException('Chuỗi ca không tồn tại')
      }

      return repos.assistantShiftRepository.updateBySeriesAndStartAtRange(assistantShiftSeriesId, startAt, endAt, {
        selfRegistrationOpenAt,
        selfRegistrationCloseAt,
      })
    })

    return BaseResponseDto.success('Đặt thời gian tự đăng ký ca thành công', { updatedCount })
  }
}
