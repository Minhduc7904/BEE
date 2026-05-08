import {
  IsOptionalBoolean,
  IsOptionalInt,
  IsOptionalString,
} from 'src/shared/decorators/validate'

export class GetSeoMediaSlotListDto {
  @IsOptionalInt('So trang', 1, 1000)
  page?: number = 1

  @IsOptionalInt('Kich thuoc trang', 1, 1000)
  limit?: number = 10

  @IsOptionalBoolean('Trang thai kich hoat')
  isActive?: boolean

  @IsOptionalString('Ma trang', 100)
  pageKey?: string

  @IsOptionalString('Loai slot', 50)
  type?: string

  @IsOptionalBoolean('Bao gom danh sach item')
  includeItems?: boolean
}
