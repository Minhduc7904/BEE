import type { ParentScheduleAttendance } from '../../interfaces'
import type { AttendanceStatus } from '../../../shared/enums/attendance-status.enum'

export class ParentScheduleAttendanceDto {
  attendanceId: number
  status: AttendanceStatus
  markedAt: string
  notes: string | null

  static fromResult(result: ParentScheduleAttendance): ParentScheduleAttendanceDto {
    return {
      attendanceId: result.attendanceId,
      status: result.status,
      markedAt: result.markedAt.toISOString(),
      notes: result.notes,
    }
  }
}
