import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser, ParentNextScheduleOverview } from '../../interfaces'
import { ParentStudentScheduleReadService } from '../../interfaces'
import { ParentNextScheduleOverviewDto } from '../../dtos/parent-student-schedule'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ParentNextScheduleSource } from '../../../shared/enums/parent-next-schedule-source.enum'
import { ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import { resolveScheduleStatus, resolveVietnamClock } from './parent-student-schedule-week'
import { selectFallbackClass } from './select-fallback-class'

/**
 * Card "Buổi học tiếp theo": buổi học chưa kết thúc gần nhất (đang diễn ra trước sắp tới); nếu không có buổi nào,
 * lớp dự phòng của học sinh; nếu không có lớp đang hoạt động hay sắp bắt đầu thì `data = null`.
 */
@Injectable()
export class GetParentStudentNextScheduleOverviewUseCase {
  constructor(private readonly schedule: ParentStudentScheduleReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    now: Date = new Date(),
  ): Promise<BaseResponseDto<ParentNextScheduleOverviewDto | null>> {
    if (identity.userType !== 'parent' || !identity.parentId) {
      throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể xem lịch học của học sinh')
    }
    if (!(await this.schedule.isStudentLinked(identity.parentId, studentId))) {
      throw new ForbiddenException('Phụ huynh không có quyền quản lý học sinh này')
    }

    const clock = resolveVietnamClock(now)
    const overview = await this.resolveOverview(studentId, clock)
    if (!overview) {
      return BaseResponseDto.success('Không có buổi học sắp tới', null)
    }

    return BaseResponseDto.success(
      'Lấy buổi học tiếp theo thành công',
      ParentNextScheduleOverviewDto.fromResult(overview),
    )
  }

  private async resolveOverview(
    studentId: number,
    clock: ReturnType<typeof resolveVietnamClock>,
  ): Promise<ParentNextScheduleOverview | null> {
    const session = await this.schedule.findNextSession(studentId, clock)
    if (session) {
      return {
        source: ParentNextScheduleSource.SESSION,
        scheduleClass: {
          classId: session.classId,
          className: session.className,
          weeklySchedule: session.classWeeklySchedule,
          classStartDate: session.classStartDate,
          classEndDate: session.classEndDate,
          room: session.room,
          instructorName: session.instructorName,
        },
        session,
        scheduleStatus: resolveScheduleStatus(session, clock),
      }
    }

    const classes = await this.schedule.listNonEndedEnrolledClasses(studentId, clock.today)
    const scheduleClass = selectFallbackClass(classes, clock.today)
    return scheduleClass ? { source: ParentNextScheduleSource.CLASS_FALLBACK, scheduleClass } : null
  }
}
