import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftResponseDto, BaseResponseDto, CreateAssistantShiftDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { assertRange, assertSelfRegistrationWindow } from './assistant-shift.use-case.helpers'

@Injectable()
export class CreateAssistantShiftUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(dto: CreateAssistantShiftDto) {
    const item = await this.uow.executeInTransaction(async (repos) => {
      if (!(await repos.assistantShiftSeriesRepository.findById(dto.assistantShiftSeriesId))) {
        throw new NotFoundException('Chuỗi ca không tồn tại')
      }

      const startAt = new Date(dto.startAt)
      const endAt = new Date(dto.endAt)
      assertRange(startAt, endAt)
      const selfRegistrationOpenAt = dto.selfRegistrationOpenAt ? new Date(dto.selfRegistrationOpenAt) : null
      const selfRegistrationCloseAt = dto.selfRegistrationCloseAt ? new Date(dto.selfRegistrationCloseAt) : null
      assertSelfRegistrationWindow(selfRegistrationOpenAt, selfRegistrationCloseAt)

      return repos.assistantShiftRepository.create({
        ...dto,
        isBaseShift: false,
        startAt,
        endAt,
        selfRegistrationOpenAt,
        selfRegistrationCloseAt,
      })
    })

    return BaseResponseDto.success('Tạo ca thành công', new AssistantShiftResponseDto(item))
  }
}
