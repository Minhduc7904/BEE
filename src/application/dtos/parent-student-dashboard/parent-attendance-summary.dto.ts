import type { ParentAttendanceSummary } from '../../interfaces'

export class ParentAttendanceSummaryDto {
  month: number
  year: number
  total: number
  present: number
  /** Chỉ buổi vắng chưa được học bù; buổi vắng đã bù không nằm trong absent, total hay attended. */
  absent: number
  late: number
  makeup: number
  attended: number
  attendanceRate: number

  static fromResult(result: ParentAttendanceSummary): ParentAttendanceSummaryDto {
    return {
      month: result.month,
      year: result.year,
      total: result.total,
      present: result.present,
      absent: result.absent,
      late: result.late,
      makeup: result.makeup,
      attended: result.attended,
      attendanceRate: result.attendanceRate,
    }
  }
}
