import { IsOptionalBoolean, IsOptionalString } from '../../../../shared/decorators/validate'

export class UpdateAssistantShiftSeriesDto {
  @IsOptionalString('Tên chuỗi ca', 200)
  name?: string

  @IsOptionalBoolean('Trạng thái khóa')
  isLocked?: boolean
}
