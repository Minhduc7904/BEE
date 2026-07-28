import { IsOptionalBoolean, IsOptionalDate, IsOptionalIdNumber } from '../../../shared/decorators/validate'
import { ListQueryDto } from '../pagination/list-query.dto'

export class AssistantTaskProductListQueryDto extends ListQueryDto {
  @IsOptionalIdNumber('ID trợ giảng')
  assistantId?: number

  @IsOptionalIdNumber('ID đề thi')
  examId?: number

  @IsOptionalIdNumber('ID công việc')
  taskId?: number

  @IsOptionalDate('Từ thời gian tạo')
  startAt?: string

  @IsOptionalDate('Đến thời gian tạo')
  endAt?: string

  @IsOptionalBoolean('Bao gồm công việc')
  includeTasks?: boolean
}
