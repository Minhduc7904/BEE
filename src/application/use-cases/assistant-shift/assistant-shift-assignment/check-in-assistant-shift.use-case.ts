import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftReminderEmailServicePort } from '../../../interfaces'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { AssistantShiftAssignmentAttendanceStatus } from '../../../../shared/enums'
import { BusinessLogicException, NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { assertAssistantShiftAvailableToAssistant } from '../assistant-shift/assistant-shift.use-case.helpers'

export interface AssistantShiftCheckInPageResult {
  success: boolean
  message: string
}

@Injectable()
export class CheckInAssistantShiftUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject(AssistantShiftReminderEmailServicePort)
    private readonly emailService: AssistantShiftReminderEmailServicePort,
  ) {}

  async execute(assistantShiftId: number, token?: string): Promise<AssistantShiftCheckInPageResult> {
    try {
      if (!token?.trim()) throw new BusinessLogicException('Liên kết điểm danh không hợp lệ')

      const checkInResult = await this.uow.executeInTransaction(async (repos) => {
        const assignment = await repos.assistantShiftAssignmentRepository.findByCheckInToken(assistantShiftId, token)
        if (!assignment) throw new NotFoundException('Liên kết điểm danh không hợp lệ')

        const shift = await repos.assistantShiftRepository.findById(assistantShiftId, { includeSeries: true })
        try {
          assertAssistantShiftAvailableToAssistant(shift)
        } catch {
          throw new NotFoundException('Liên kết điểm danh không hợp lệ')
        }

        const now = new Date()
        const openAt = new Date(shift.startAt.getTime() - 45 * 60 * 1000)
        if (now >= shift.endAt) {
          throw new BusinessLogicException('Đã hết hạn điểm danh')
        }
        if (now < openAt) {
          throw new BusinessLogicException('Chưa đến thời gian điểm danh')
        }
        if (assignment.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PRESENT) {
          return { alreadyCheckedIn: true, successEmail: null }
        }
        if (!assignment.isPending()) {
          throw new BusinessLogicException('Ca này không còn ở trạng thái chờ điểm danh')
        }

        await repos.assistantShiftAssignmentRepository.update(assistantShiftId, assignment.adminId, {
          attendanceStatus: AssistantShiftAssignmentAttendanceStatus.PRESENT,
        })

        const assistant = await repos.adminRepository.findById(assignment.adminId)
        const recipientEmail = assistant?.getEmail()?.trim()

        return {
          alreadyCheckedIn: false,
          successEmail: recipientEmail
            ? {
                recipientEmail,
                recipientName: assistant?.getFullName() ?? 'Trợ giảng',
                shiftName: shift.name,
                startAt: shift.startAt,
                endAt: shift.endAt,
              }
            : null,
        }
      })

      if (checkInResult.successEmail) {
        await this.emailService.sendCheckInSuccess(checkInResult.successEmail).catch(() => undefined)
      }

      return {
        success: true,
        message: checkInResult.alreadyCheckedIn
          ? 'Bạn đã điểm danh thành công rồi.'
          : 'Bạn đã điểm danh thành công. Chúc bạn có một ca trợ giảng hiệu quả!',
      }
    } catch (error) {
      if (error instanceof BusinessLogicException || error instanceof NotFoundException) {
        return { success: false, message: error.message }
      }

      return {
        success: false,
        message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
      }
    }
  }
}
