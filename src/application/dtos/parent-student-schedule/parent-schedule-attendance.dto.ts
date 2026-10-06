import type { ParentScheduleAttendance } from '../../interfaces'
import type { AttendanceStatus } from '../../../shared/enums/attendance-status.enum'
import type { AttendanceType } from '../../../shared/enums/attendance-type.enum'

export class ParentScheduleAttendanceDto {
  attendanceId: number
  status: AttendanceStatus
  attendanceType: AttendanceType
  markedAt: string
  notes: string | null

  static fromResult(result: ParentScheduleAttendance): ParentScheduleAttendanceDto {
    return {
      attendanceId: result.attendanceId,
      status: result.status,
      attendanceType: result.attendanceType,
      markedAt: result.markedAt.toISOString(),
      notes: result.notes,
    }
  }
}
