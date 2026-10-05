import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser, ParentAttendanceSummary } from '../../interfaces'
import { ParentStudentDashboardReadService } from '../../interfaces'
import { ParentAttendanceSummaryDto, ParentMonthQueryDto } from '../../dtos/parent-student-dashboard'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { getMonthDateOnlyRange } from '../../../shared/utils/vietnam-month.util'
import { assertParentManagesStudent } from './parent-student-dashboard-access'

@Injectable()
export class GetParentStudentAttendanceSummaryUseCase {
  constructor(private readonly dashboard: ParentStudentDashboardReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    query: ParentMonthQueryDto,
  ): Promise<BaseResponseDto<ParentAttendanceSummaryDto>> {
    await assertParentManagesStudent(identity, studentId, this.dashboard)

    const { from, toExclusive } = getMonthDateOnlyRange(query.month, query.year)
    const counts = await this.dashboard.countAttendanceByStatus(studentId, from, toExclusive)

    const total = counts.present + counts.absent + counts.late + counts.makeup
    const attended = counts.present + counts.late + counts.makeup
    const summary: ParentAttendanceSummary = {
      month: query.month,
      year: query.year,
      total,
      ...counts,
      attended,
      attendanceRate: total === 0 ? 0 : Math.round((attended / total) * 10000) / 100,
    }

    return BaseResponseDto.success('Lấy thống kê điểm danh thành công', ParentAttendanceSummaryDto.fromResult(summary))
  }
}
