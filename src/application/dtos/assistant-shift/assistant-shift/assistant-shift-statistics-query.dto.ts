import { IsOptionalIdNumber } from '../../../../shared/decorators/validate'
import { AssistantShiftDateRangeQueryDto } from './assistant-shift-date-range-query.dto'

export class AssistantShiftStatisticsQueryDto extends AssistantShiftDateRangeQueryDto {
  @IsOptionalIdNumber('ID trợ giảng')
  adminId?: number
}
