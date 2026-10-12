import type { ParentNextScheduleOverview } from '../../interfaces'
import type { ParentNextScheduleSource } from '../../../shared/enums/parent-next-schedule-source.enum'
import type { ParentScheduleStatus } from '../../../shared/enums/parent-schedule-status.enum'
import {
  formatScheduleDate,
  formatScheduleTime,
} from '../../use-cases/parent-student-schedule/parent-student-schedule-week'
import { ParentScheduleAttendanceDto } from './parent-schedule-attendance.dto'
import { ParentScheduleHomeworkDto } from './parent-schedule-homework.dto'

/**
 * Phẳng: thông tin lớp luôn có; trường buổi học chỉ có khi `source = SESSION`
 * và đều là null khi `source = CLASS_FALLBACK`.
 */
export class ParentNextScheduleOverviewDto {
  source: ParentNextScheduleSource
  classId: number
  className: string
  weeklySchedule: string | null
  classStartDate: string | null
  classEndDate: string | null
  room: string | null
  instructorName: string | null
  sessionId: number | null
  sessionName: string | null
  sessionDate: string | null
  startTime: string | null
  endTime: string | null
  makeupNote: string | null
  attendance: ParentScheduleAttendanceDto | null
  homework: ParentScheduleHomeworkDto | null
  scheduleStatus: ParentScheduleStatus | null

  static fromResult(result: ParentNextScheduleOverview): ParentNextScheduleOverviewDto {
    const { scheduleClass } = result
    const classFields = {
      source: result.source,
      classId: scheduleClass.classId,
      className: scheduleClass.className,
      weeklySchedule: scheduleClass.weeklySchedule,
      classStartDate: scheduleClass.classStartDate ? formatScheduleDate(scheduleClass.classStartDate) : null,
      classEndDate: scheduleClass.classEndDate ? formatScheduleDate(scheduleClass.classEndDate) : null,
      room: scheduleClass.room,
      instructorName: scheduleClass.instructorName,
    }

    if ('session' in result) {
      const { session } = result

      return {
        ...classFields,
        sessionId: session.sessionId,
        sessionName: session.name,
        sessionDate: formatScheduleDate(session.sessionDate),
        startTime: formatScheduleTime(session.startTime),
        endTime: formatScheduleTime(session.endTime),
        makeupNote: session.makeupNote,
        attendance: session.attendance ? ParentScheduleAttendanceDto.fromResult(session.attendance) : null,
        homework: session.homework ? ParentScheduleHomeworkDto.fromResult(session.homework) : null,
        scheduleStatus: result.scheduleStatus,
      }
    }

    return {
      ...classFields,
      sessionId: null,
      sessionName: null,
      sessionDate: null,
      startTime: null,
      endTime: null,
      makeupNote: null,
      attendance: null,
      homework: null,
      scheduleStatus: null,
    }
  }
}
