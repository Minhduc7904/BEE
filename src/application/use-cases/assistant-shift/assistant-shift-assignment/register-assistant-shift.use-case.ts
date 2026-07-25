import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftAssignmentResponseDto, BaseResponseDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { BusinessLogicException, ConflictException } from '../../../../shared/exceptions/custom-exceptions'
import {
  assertAssistantShiftAvailableToAssistant,
  assertEligibleAssistant,
  isWithinSelfRegistrationWindow,
} from '../assistant-shift/assistant-shift.use-case.helpers'

@Injectable()
export class RegisterAssistantShiftUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftId: number, adminId: number) {
    const item = await this.uow.executeInTransaction(async (repos) => {
      await assertEligibleAssistant(adminId, repos.adminRepository)
      const shift = await repos.assistantShiftRepository.findById(assistantShiftId, { includeSeries: true })
      assertAssistantShiftAvailableToAssistant(shift)

      const now = new Date()
      if (now >= shift.endAt) {
        throw new BusinessLogicException('Không thể đăng ký ca đã kết thúc')
      }
      if (!isWithinSelfRegistrationWindow(shift, now)) {
        throw new BusinessLogicException('Ca chưa trong thời gian tự đăng ký')
      }
      if (await repos.assistantShiftAssignmentRepository.findById(assistantShiftId, adminId)) {
        throw new ConflictException('Bạn đã đăng ký ca này')
      }

      return repos.assistantShiftAssignmentRepository.create({ assistantShiftId, adminId })
    })

    return BaseResponseDto.success('Đăng ký ca thành công', new AssistantShiftAssignmentResponseDto(item))
  }
}
