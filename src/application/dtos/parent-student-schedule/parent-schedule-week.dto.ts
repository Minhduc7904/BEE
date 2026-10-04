import type { ParentScheduleSession } from '../../interfaces'
import { ParentScheduleSessionDto } from './parent-schedule-session.dto'

export class ParentScheduleWeekDto {
  studentId: number
  weekStart: string
  weekEnd: string
  sessions: ParentScheduleSessionDto[]

  static fromResult(
    studentId: number,
    weekStart: string,
    weekEnd: string,
    sessions: ParentScheduleSession[],
  ): ParentScheduleWeekDto {
    return {
      studentId,
      weekStart,
      weekEnd,
      sessions: sessions.map((session) => ParentScheduleSessionDto.fromResult(session)),
    }
  }
}
