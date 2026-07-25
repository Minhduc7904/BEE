import { Inject, Injectable } from '@nestjs/common'
import {
  AssistantShiftAssistantStatisticsResponseDto,
  AssistantShiftDateRangeQueryDto,
  BaseResponseDto,
} from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { AssistantShiftAssignmentAttendanceStatus } from '../../../../shared/enums'
import { ASSISTANT_SHIFT_CONFIG } from '../../../../shared/constants/assistant-shift.constants'
import { BusinessLogicException } from '../../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetAssistantShiftAssistantStatisticsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(query: AssistantShiftDateRangeQueryDto) {
    const range = query.toRange()
    if (range.startAtFrom > range.startAtTo) throw new BusinessLogicException('Khoảng thời gian không hợp lệ')

    const response = await this.uow.executeInTransaction(async (repos) => {
      const [assistants, shifts] = await Promise.all([
        repos.adminRepository.findAllByRoleId(ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID),
        repos.assistantShiftRepository.findAll({
          ...range,
          excludeBaseShifts: true,
          includeAssignmentsWithAdmin: true,
        }),
      ])

      const statisticsByAdminId = new Map(
        assistants.map((assistant) => [
          assistant.adminId,
          {
            adminId: assistant.adminId,
            userId: assistant.userId,
            fullName: assistant.getFullName(),
            registeredShiftCount: 0,
            workedHours: 0,
            absentHours: 0,
            pendingHours: 0,
          },
        ]),
      )

      for (const shift of shifts) {
        const hours = (shift.endAt.getTime() - shift.startAt.getTime()) / (60 * 60 * 1000)
        for (const assignment of shift.assignments ?? []) {
          const statistics = statisticsByAdminId.get(assignment.adminId)
          if (!statistics) continue

          statistics.registeredShiftCount += 1
          if (assignment.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PRESENT) {
            statistics.workedHours += hours
          } else if (assignment.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.ABSENT) {
            statistics.absentHours += hours
          } else {
            statistics.pendingHours += hours
          }
        }
      }

      return {
        startAt: range.startAtFrom,
        endAt: range.startAtTo,
        assistants: [...statisticsByAdminId.values()].map((statistics) => ({
          ...statistics,
          workedHours: Math.round(statistics.workedHours * 100) / 100,
          absentHours: Math.round(statistics.absentHours * 100) / 100,
          pendingHours: Math.round(statistics.pendingHours * 100) / 100,
        })),
      } satisfies AssistantShiftAssistantStatisticsResponseDto
    })

    return BaseResponseDto.success('Lấy thống kê trợ giảng thành công', response)
  }
}
