import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { BusinessLogicException, NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import {
  assertAssistantShiftAvailableToAssistant,
  isWithinSelfRegistrationWindow,
} from '../assistant-shift/assistant-shift.use-case.helpers'

@Injectable()
export class CancelAssistantShiftRegistrationUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftId: number, adminId: number) {
    await this.uow.executeInTransaction(async (repos) => {
      const shift = await repos.assistantShiftRepository.findById(assistantShiftId, { includeSeries: true })
      assertAssistantShiftAvailableToAssistant(shift)

      const now = new Date()
      if (now >= shift.endAt) {
        throw new BusinessLogicException('Không thể hủy đăng ký ca đã kết thúc')
      }
      if (!isWithinSelfRegistrationWindow(shift, now)) {
        throw new BusinessLogicException('Ca chưa trong thời gian tự đăng ký')
      }
      const assignment = await repos.assistantShiftAssignmentRepository.findById(assistantShiftId, adminId)
      if (!assignment) {
        throw new NotFoundException('Bạn chưa đăng ký ca này')
      }
      if (!assignment.isPending()) {
        throw new BusinessLogicException('Chỉ có thể hủy đăng ký khi assignment đang ở trạng thái chờ')
      }

      await repos.assistantShiftAssignmentRepository.delete(assistantShiftId, adminId)
    })

    return BaseResponseDto.success('Hủy đăng ký ca thành công', { cancelled: true })
  }
}
