import type { ParentScheduleAttendanceDetail } from '../../interfaces'
import { ParentScheduleAttendanceDto } from './parent-schedule-attendance.dto'

export class ParentScheduleAttendanceDetailDto extends ParentScheduleAttendanceDto {
  markerName: string | null

  static fromDetail(result: ParentScheduleAttendanceDetail): ParentScheduleAttendanceDetailDto {
    return {
      ...ParentScheduleAttendanceDto.fromResult(result),
      markerName: result.markerName,
    }
  }
}
