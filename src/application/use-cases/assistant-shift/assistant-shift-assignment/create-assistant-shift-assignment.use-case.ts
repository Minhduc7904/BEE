import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftAssignmentResponseDto, BaseResponseDto, CreateAssistantShiftAssignmentDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { assertEligibleAssistant } from '../assistant-shift/assistant-shift.use-case.helpers'

@Injectable()
export class CreateAssistantShiftAssignmentUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftId: number, dto: CreateAssistantShiftAssignmentDto) {
    const item = await this.uow.executeInTransaction(async (repos) => {
      if (!(await repos.assistantShiftRepository.findById(assistantShiftId))) {
        throw new NotFoundException('Ca trợ giảng không tồn tại')
      }

      await assertEligibleAssistant(dto.adminId, repos.adminRepository)
      return repos.assistantShiftAssignmentRepository.create({
        assistantShiftId,
        ...dto,
      })
    })

    return BaseResponseDto.success('Phân công trợ giảng thành công', new AssistantShiftAssignmentResponseDto(item))
  }
}
