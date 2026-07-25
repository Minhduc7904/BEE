import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { AssistantShiftAssignmentAttendanceStatus } from '../../../../shared/enums'

@Injectable()
export class GetMyAssistantShiftMonthlyStatisticsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(adminId: number) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const monthEnd = new Date(nextMonthStart.getTime() - 1)
    const shifts = await this.uow.executeInTransaction((repos) =>
      repos.assistantShiftRepository.findAll({
        assignedAdminId: adminId,
        excludeBaseShifts: true,
        startAtFrom: monthStart,
        startAtTo: monthEnd,
        includeAssignmentsForAdminId: adminId,
      }),
    )

    let workedShiftCount = 0
    let workedHours = 0
    let absentShiftCount = 0
    let absentHours = 0
    for (const shift of shifts) {
      const attendanceStatus = shift.assignments?.[0]?.attendanceStatus
      const hours = (shift.endAt.getTime() - shift.startAt.getTime()) / (60 * 60 * 1000)
      if (attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PRESENT) {
        workedShiftCount += 1
        workedHours += hours
      } else if (attendanceStatus === AssistantShiftAssignmentAttendanceStatus.ABSENT) {
        absentShiftCount += 1
        absentHours += hours
      }
    }

    return BaseResponseDto.success('Lấy thống kê ca trợ giảng tháng này thành công', {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      workedShiftCount,
      workedHours: Math.round(workedHours * 100) / 100,
      absentShiftCount,
      absentHours: Math.round(absentHours * 100) / 100,
    })
  }
}
