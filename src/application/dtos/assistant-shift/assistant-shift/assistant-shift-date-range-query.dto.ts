import { IsOptionalEnumValue, IsRequiredDate } from '../../../../shared/decorators/validate'
import { AssistantShiftAssignmentAttendanceStatus } from '../../../../shared/enums'

export class AssistantShiftDateRangeQueryDto {
  @IsRequiredDate('Ngày bắt đầu')
  startAt!: string

  @IsRequiredDate('Ngày kết thúc')
  endAt!: string

  @IsOptionalEnumValue(AssistantShiftAssignmentAttendanceStatus, 'Trạng thái phân công')
  attendanceStatus?: AssistantShiftAssignmentAttendanceStatus

  toRange(): { startAtFrom: Date; startAtTo: Date } {
    const startAtFrom = new Date(this.startAt)
    startAtFrom.setDate(startAtFrom.getDate() - 1)
    startAtFrom.setHours(0, 0, 0, 0)

    const startAtTo = new Date(this.endAt)
    startAtTo.setHours(23, 59, 59, 999)

    return { startAtFrom, startAtTo }
  }
}
