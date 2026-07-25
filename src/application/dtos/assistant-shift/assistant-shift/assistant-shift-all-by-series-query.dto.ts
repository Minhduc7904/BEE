import { IsOptionalIdNumber, IsRequiredIntArray } from '../../../../shared/decorators/validate'
import { AssistantShiftDateRangeQueryDto } from './assistant-shift-date-range-query.dto'

export class AssistantShiftAllBySeriesQueryDto extends AssistantShiftDateRangeQueryDto {
  @IsRequiredIntArray('Danh sách ID chuỗi ca')
  assistantShiftSeriesIds!: number[]

  @IsOptionalIdNumber('ID trợ giảng')
  adminId?: number
}
