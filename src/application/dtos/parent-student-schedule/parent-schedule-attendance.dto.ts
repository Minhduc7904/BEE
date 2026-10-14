import type { ParentScheduleAttendance } from '../../interfaces'
import type { AttendanceStatus } from '../../../shared/enums/attendance-status.enum'
import type { AttendanceType } from '../../../shared/enums/attendance-type.enum'
import { ParentScheduleMakeupReferenceDto } from './parent-schedule-makeup-reference.dto'

export class ParentScheduleAttendanceDto {
  attendanceId: number
  status: AttendanceStatus
  attendanceType: AttendanceType
  makeupByAttendanceId: number | null
  isMadeUp: boolean
  makeupBy: ParentScheduleMakeupReferenceDto | null
  markedAt: string
  notes: string | null

  static fromResult(result: ParentScheduleAttendance): ParentScheduleAttendanceDto {
    return {
      attendanceId: result.attendanceId,
      status: result.status,
      attendanceType: result.attendanceType,
      makeupByAttendanceId: result.makeupByAttendanceId,
      isMadeUp: result.isMadeUp,
      makeupBy: result.makeupBy ? ParentScheduleMakeupReferenceDto.fromResult(result.makeupBy) : null,
      markedAt: result.markedAt.toISOString(),
      notes: result.notes,
    }
  }
}
