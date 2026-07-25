import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteAssistantShiftUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftId: number) {
    await this.uow.executeInTransaction(async (repos) => {
      if (!(await repos.assistantShiftRepository.findById(assistantShiftId))) {
        throw new NotFoundException('Ca trợ giảng không tồn tại')
      }

      await repos.assistantShiftRepository.delete(assistantShiftId)
    })

    return BaseResponseDto.success('Xóa ca thành công', { deleted: true })
  }
}
