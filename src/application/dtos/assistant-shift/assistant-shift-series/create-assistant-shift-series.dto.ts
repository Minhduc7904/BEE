import { IsOptionalBoolean, IsRequiredString } from '../../../../shared/decorators/validate'

export class CreateAssistantShiftSeriesDto {
  @IsRequiredString('Tên chuỗi ca', 200)
  name!: string

  @IsOptionalBoolean('Trạng thái khóa')
  isLocked?: boolean
}
