import {
  IsOptionalBoolean,
  IsOptionalDate,
  IsOptionalEnumValue,
  IsOptionalString,
  IsOptionalNullableIdNumber,
} from '../../../shared/decorators/validate'
import { AssistantTaskStatus, AssistantTaskType } from '../../../shared/enums'

export class UpdateAssistantTaskDto {
  @IsOptionalNullableIdNumber('ID khóa học')
  courseId?: number | null

  @IsOptionalNullableIdNumber('ID trợ giảng')
  assistantId?: number | null

  @IsOptionalString('Tên công việc', 255)
  taskName?: string | null

  @IsOptionalEnumValue(AssistantTaskType, 'Loại công việc')
  taskType?: AssistantTaskType | null

  @IsOptionalEnumValue(AssistantTaskStatus, 'Trạng thái')
  status?: AssistantTaskStatus

  @IsOptionalBoolean('Là công việc mẫu')
  isBaseTask?: boolean

  @IsOptionalDate('Hạn hoàn thành')
  deadlineAt?: string | null

  @IsOptionalDate('Thời gian hoàn thành')
  completedAt?: string | null

  @IsOptionalString('Ghi chú')
  note?: string | null
}
