import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftAssignmentResponseDto, BaseResponseDto, UpdateAssistantShiftAssignmentDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateAssistantShiftAssignmentUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftId: number, adminId: number, dto: UpdateAssistantShiftAssignmentDto) {
    const item = await this.uow.executeInTransaction(async (repos) => {
      if (!(await repos.assistantShiftAssignmentRepository.findById(assistantShiftId, adminId))) {
        throw new NotFoundException('Phân công không tồn tại')
      }

      return repos.assistantShiftAssignmentRepository.update(assistantShiftId, adminId, dto)
    })

    return BaseResponseDto.success('Cập nhật phân công thành công', new AssistantShiftAssignmentResponseDto(item))
  }
}
