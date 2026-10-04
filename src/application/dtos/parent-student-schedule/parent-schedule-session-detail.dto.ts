import type { ParentScheduleSessionDetail } from '../../interfaces'
import {
  formatScheduleDate,
  formatScheduleTime,
} from '../../use-cases/parent-student-schedule/parent-student-schedule-week'
import { ParentScheduleAttendanceDetailDto } from './parent-schedule-attendance-detail.dto'
import { ParentScheduleHomeworkDto } from './parent-schedule-homework.dto'
import { ParentScheduleMakeupOptionDto } from './parent-schedule-makeup-option.dto'

export class ParentScheduleSessionDetailDto {
  sessionId: number
  studentId: number
  classId: number
  name: string
  sessionDate: string
  startTime: string
  endTime: string
  className: string
  room: string | null
  instructorName: string | null
  makeupNote: string | null
  attendance: ParentScheduleAttendanceDetailDto | null
  homework: ParentScheduleHomeworkDto | null
  makeupOptions: ParentScheduleMakeupOptionDto[]

  static fromResult(studentId: number, result: ParentScheduleSessionDetail): ParentScheduleSessionDetailDto {
    return {
      sessionId: result.sessionId,
      studentId,
      classId: result.classId,
      name: result.name,
      sessionDate: formatScheduleDate(result.sessionDate),
      startTime: formatScheduleTime(result.startTime),
      endTime: formatScheduleTime(result.endTime),
      className: result.className,
      room: result.room,
      instructorName: result.instructorName,
      makeupNote: result.makeupNote,
      attendance: result.attendance ? ParentScheduleAttendanceDetailDto.fromDetail(result.attendance) : null,
      homework: result.homework ? ParentScheduleHomeworkDto.fromResult(result.homework) : null,
      makeupOptions: result.makeupOptions.map((option) => ParentScheduleMakeupOptionDto.fromResult(option)),
    }
  }
}
