import type { ParentScheduleSession } from '../../interfaces'
import {
  formatScheduleDate,
  formatScheduleTime,
} from '../../use-cases/parent-student-schedule/parent-student-schedule-week'
import { ParentScheduleAttendanceDto } from './parent-schedule-attendance.dto'
import { ParentScheduleHomeworkDto } from './parent-schedule-homework.dto'

export class ParentScheduleSessionDto {
  sessionId: number
  classId: number
  name: string
  sessionDate: string
  startTime: string
  endTime: string
  className: string
  room: string | null
  instructorName: string | null
  makeupNote: string | null
  attendance: ParentScheduleAttendanceDto | null
  homework: ParentScheduleHomeworkDto | null

  static fromResult(result: ParentScheduleSession): ParentScheduleSessionDto {
    return {
      sessionId: result.sessionId,
      classId: result.classId,
      name: result.name,
      sessionDate: formatScheduleDate(result.sessionDate),
      startTime: formatScheduleTime(result.startTime),
      endTime: formatScheduleTime(result.endTime),
      className: result.className,
      room: result.room,
      instructorName: result.instructorName,
      makeupNote: result.makeupNote,
      attendance: result.attendance ? ParentScheduleAttendanceDto.fromResult(result.attendance) : null,
      homework: result.homework ? ParentScheduleHomeworkDto.fromResult(result.homework) : null,
    }
  }
}
