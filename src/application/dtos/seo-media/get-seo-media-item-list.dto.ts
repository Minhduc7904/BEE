import { IsOptionalBoolean, IsOptionalInt } from 'src/shared/decorators/validate'

export class GetSeoMediaItemListDto {
  @IsOptionalInt('Số trang', 1, 1000)
  page?: number = 1

  @IsOptionalInt('Kích thước trang', 1, 1000)
  limit?: number = 10

  @IsOptionalBoolean('Bao gồm thông tin slot')
  includeSlot?: boolean
}
