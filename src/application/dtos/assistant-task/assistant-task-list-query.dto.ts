import {
  IsOptionalBoolean,
  IsOptionalDate,
  IsOptionalEnumValue,
  IsOptionalIdNumber,
  IsOptionalString,
} from '../../../shared/decorators/validate'
import { AssistantTaskStatus, AssistantTaskType } from '../../../shared/enums'
import { ListQueryDto } from '../pagination/list-query.dto'

export class AssistantTaskListQueryDto extends ListQueryDto {
  @IsOptionalIdNumber('ID khóa học')
  courseId?: number

  @IsOptionalIdNumber('ID trợ giảng')
  assistantId?: number

  @IsOptionalIdNumber('ID sản phẩm')
  productId?: number

  @IsOptionalString('Tên công việc', 255)
  taskName?: string

  @IsOptionalEnumValue(AssistantTaskType, 'Loại công việc')
  taskType?: AssistantTaskType

  @IsOptionalEnumValue(AssistantTaskStatus, 'Trạng thái')
  status?: AssistantTaskStatus

  @IsOptionalBoolean('Là công việc mẫu')
  isBaseTask?: boolean

  @IsOptionalDate('Từ hạn hoàn thành')
  startAt?: string

  @IsOptionalDate('Đến hạn hoàn thành')
  endAt?: string

  @IsOptionalBoolean('Bao gồm sản phẩm')
  includeProducts?: boolean
}
