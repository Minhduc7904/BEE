import { IsOptionalEnumValue, IsOptionalString, IsRequiredIdNumber } from '../../../../shared/decorators/validate'
import { AssistantShiftAssignmentAttendanceStatus } from '../../../../shared/enums'

export class CreateAssistantShiftAssignmentDto {
  @IsRequiredIdNumber('ID trợ giảng')
  adminId!: number

  @IsOptionalEnumValue(AssistantShiftAssignmentAttendanceStatus, 'Trạng thái chấm công')
  attendanceStatus?: AssistantShiftAssignmentAttendanceStatus

  @IsOptionalString('Lý do vắng')
  absenceReason?: string

  @IsOptionalString('Ghi chú quản lý')
  managerNote?: string
}
