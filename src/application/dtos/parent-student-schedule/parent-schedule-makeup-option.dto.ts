import type { ParentScheduleMakeupOption } from '../../interfaces'
import { formatScheduleDate } from '../../use-cases/parent-student-schedule/parent-student-schedule-week'

export class ParentScheduleMakeupOptionDto {
  classId: number
  className: string
  startDate: string | null
  endDate: string | null
  weeklySchedule: string | null
  room: string | null
  instructorName: string | null

  static fromResult(result: ParentScheduleMakeupOption): ParentScheduleMakeupOptionDto {
    return {
      classId: result.classId,
      className: result.className,
      startDate: result.startDate ? formatScheduleDate(result.startDate) : null,
      endDate: result.endDate ? formatScheduleDate(result.endDate) : null,
      weeklySchedule: result.weeklySchedule,
      room: result.room,
      instructorName: result.instructorName,
    }
  }
}
