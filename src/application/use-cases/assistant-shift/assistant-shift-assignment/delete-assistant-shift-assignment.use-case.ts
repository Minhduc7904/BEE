import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteAssistantShiftAssignmentUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftId: number, adminId: number) {
    await this.uow.executeInTransaction(async (repos) => {
      if (!(await repos.assistantShiftAssignmentRepository.findById(assistantShiftId, adminId))) {
        throw new NotFoundException('Phân công không tồn tại')
      }

      await repos.assistantShiftAssignmentRepository.delete(assistantShiftId, adminId)
    })

    return BaseResponseDto.success('Xóa phân công thành công', { deleted: true })
  }
}
