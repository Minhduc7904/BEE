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
            totalAssignmentCount: 0,
            totalHours: 0,
            pendingAssignmentCount: 0,
            pendingHours: 0,
            presentAssignmentCount: 0,
            presentHours: 0,
            absentAssignmentCount: 0,
            absentHours: 0,
            sundayPresentAssignmentCount: 0,
            sundayPresentHours: 0,
            presentWorkDateKeys: new Set<string>(),
            registeredShiftCount: 0,
            workedHours: 0,
          },
        ]),
      )

      for (const shift of shifts) {
        const hours = this.getShiftDurationHours(shift.startAt, shift.endAt)
        const isSunday = shift.startAt.getDay() === 0
        const workDateKey = this.getWorkDateKey(shift.startAt)
        for (const assignment of shift.assignments ?? []) {
          const statistics = statisticsByAdminId.get(assignment.adminId)
          if (!statistics) continue

          statistics.totalAssignmentCount += 1
          statistics.totalHours += hours
          statistics.registeredShiftCount += 1
          if (assignment.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PENDING) {
            statistics.pendingAssignmentCount += 1
            statistics.pendingHours += hours
          } else if (assignment.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PRESENT) {
            statistics.presentAssignmentCount += 1
            statistics.presentHours += hours
            statistics.workedHours += hours
            statistics.presentWorkDateKeys.add(workDateKey)

            if (isSunday) {
              statistics.sundayPresentAssignmentCount += 1
              statistics.sundayPresentHours += hours
            }
          } else if (assignment.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.ABSENT) {
            statistics.absentAssignmentCount += 1
            statistics.absentHours += hours
          }
        }
      }

      return {
        startAt: range.startAtFrom,
        endAt: range.startAtTo,
        assistants: [...statisticsByAdminId.values()].map((statistics) => ({
          adminId: statistics.adminId,
          userId: statistics.userId,
          fullName: statistics.fullName,
          totalAssignmentCount: statistics.totalAssignmentCount,
          totalHours: this.roundHours(statistics.totalHours),
          pendingAssignmentCount: statistics.pendingAssignmentCount,
          pendingHours: this.roundHours(statistics.pendingHours),
          presentAssignmentCount: statistics.presentAssignmentCount,
          presentHours: this.roundHours(statistics.presentHours),
          absentAssignmentCount: statistics.absentAssignmentCount,
          absentHours: this.roundHours(statistics.absentHours),
          sundayPresentAssignmentCount: statistics.sundayPresentAssignmentCount,
          sundayPresentHours: this.roundHours(statistics.sundayPresentHours),
          presentWorkDayCount: statistics.presentWorkDateKeys.size,
          registeredShiftCount: statistics.registeredShiftCount,
          workedHours: this.roundHours(statistics.workedHours),
        })),
      } satisfies AssistantShiftAssistantStatisticsResponseDto
    })

    return BaseResponseDto.success('Lấy thống kê trợ giảng thành công', response)
  }

  private getShiftDurationHours(startAt: Date, endAt: Date): number {
    return (endAt.getTime() - startAt.getTime()) / (60 * 60 * 1000)
  }

  private getWorkDateKey(startAt: Date): string {
    const year = startAt.getFullYear()
    const month = String(startAt.getMonth() + 1).padStart(2, '0')
    const day = String(startAt.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  private roundHours(hours: number): number {
    return Math.round(hours * 100) / 100
  }
}
