import { IsOptionalDate } from '../../../../shared/decorators/validate'
import { AssistantShiftRangeDto } from './assistant-shift-range.dto'

export class SetAssistantShiftSelfRegistrationWindowDto extends AssistantShiftRangeDto {
  @IsOptionalDate('Thời gian mở tự đăng ký')
  selfRegistrationOpenAt?: string | null

  @IsOptionalDate('Thời gian đóng tự đăng ký')
  selfRegistrationCloseAt?: string | null
}
