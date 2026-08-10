import { IsOptionalIdNumber } from '../../../../shared/decorators/validate'

export class AssistantShiftBaseListQueryDto {
  @IsOptionalIdNumber('ID trợ giảng')
  adminId?: number
}
