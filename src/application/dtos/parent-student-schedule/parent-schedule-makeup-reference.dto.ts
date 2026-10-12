import type { ParentScheduleMakeupReference } from '../../interfaces'
import {
  formatScheduleDate,
  formatScheduleTime,
} from '../../use-cases/parent-student-schedule/parent-student-schedule-week'

export class ParentScheduleMakeupReferenceDto {
  attendanceId: number
  sessionId: number
  classId: number
  className: string
  sessionDate: string
  startTime: string
  endTime: string

  static fromResult(result: ParentScheduleMakeupReference): ParentScheduleMakeupReferenceDto {
    return {
      attendanceId: result.attendanceId,
      sessionId: result.sessionId,
      classId: result.classId,
      className: result.className,
      sessionDate: formatScheduleDate(result.sessionDate),
      startTime: formatScheduleTime(result.startTime),
      endTime: formatScheduleTime(result.endTime),
    }
  }
}
