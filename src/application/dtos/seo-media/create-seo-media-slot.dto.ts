import { IsOptionalBoolean, IsOptionalString, IsRequiredString } from 'src/shared/decorators/validate'

export class CreateSeoMediaSlotDto {
  @IsRequiredString('Mã slot', 100)
  code: string

  @IsRequiredString('Tên slot', 255)
  name: string

  @IsOptionalString('Mô tả')
  description?: string

  @IsOptionalBoolean('Trạng thái kích hoạt')
  isActive?: boolean
}
