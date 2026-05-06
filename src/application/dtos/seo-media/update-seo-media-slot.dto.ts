import { IsOptionalBoolean, IsOptionalString } from 'src/shared/decorators/validate'

export class UpdateSeoMediaSlotDto {
  @IsOptionalString('Mã slot', 100)
  code?: string

  @IsOptionalString('Tên slot', 255)
  name?: string

  @IsOptionalString('Mô tả')
  description?: string

  @IsOptionalBoolean('Trạng thái kích hoạt')
  isActive?: boolean
}
