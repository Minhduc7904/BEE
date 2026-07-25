import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteBaseAssistantShiftUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftId: number) {
    await this.uow.executeInTransaction(async (repos) => {
      const assistantShift = await repos.assistantShiftRepository.findById(assistantShiftId)
      if (!assistantShift || !assistantShift.isBaseShift) {
        throw new NotFoundException('Ca cơ sở không tồn tại')
      }

      await repos.assistantShiftRepository.delete(assistantShiftId)
    })

    return BaseResponseDto.success('Xóa ca cơ sở thành công', { deleted: true })
  }
}
