import { IsOptionalDate, IsOptionalIdNumber } from '../../../shared/decorators/validate'
import { ListQueryDto } from '../pagination/list-query.dto'

export class AssistantTaskProductSubmissionListQueryDto extends ListQueryDto {
  @IsOptionalIdNumber('ID công việc')
  assistantTaskId?: number

  @IsOptionalIdNumber('ID sản phẩm')
  assistantTaskProductId?: number

  @IsOptionalDate('Từ thời gian nộp')
  startAt?: string

  @IsOptionalDate('Đến thời gian nộp')
  endAt?: string
}
