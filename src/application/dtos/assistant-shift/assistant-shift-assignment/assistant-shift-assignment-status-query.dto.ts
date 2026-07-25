import { IsOptionalEnumValue } from '../../../../shared/decorators/validate'
import { AssistantShiftAssignmentAttendanceStatus } from '../../../../shared/enums'

export class AssistantShiftAssignmentStatusQueryDto {
  @IsOptionalEnumValue(AssistantShiftAssignmentAttendanceStatus, 'Trạng thái phân công')
  attendanceStatus?: AssistantShiftAssignmentAttendanceStatus
}
