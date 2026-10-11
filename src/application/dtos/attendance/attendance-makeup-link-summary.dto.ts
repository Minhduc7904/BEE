import type { Attendance } from 'src/domain/entities/attendance/attendance.entity'
import { AttendanceStatus } from 'src/shared/enums'

/**
 * Tóm tắt một bản ghi điểm danh đầu bên kia của liên kết học bù (buổi đã bù / buổi đã được bù).
 */
export class AttendanceMakeupLinkSummaryDto {
  attendanceId: number
  sessionId: number
  status: AttendanceStatus
  /** Tên buổi học. */
  sessionName: string | null
  /** Ngày học dạng YYYY-MM-DD (cột DATE, không phụ thuộc múi giờ). */
  sessionDate: string | null
  startTime: Date | null
  endTime: Date | null
  classId: number | null
  className: string | null

  constructor(attendance: Attendance) {
    const session = attendance.classSession

    this.attendanceId = attendance.attendanceId
    this.sessionId = attendance.sessionId
    this.status = attendance.status
    this.sessionName = session?.name ?? null
    this.sessionDate = session ? session.sessionDate.toISOString().slice(0, 10) : null
    this.startTime = session?.startTime ?? null
    this.endTime = session?.endTime ?? null
    this.classId = session?.classId ?? null
    this.className = session?.courseClass?.className ?? null
  }
}
