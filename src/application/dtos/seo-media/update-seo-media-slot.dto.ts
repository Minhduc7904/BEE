import { IsObject, IsOptional } from 'class-validator'
import {
  IsOptionalBoolean,
  IsOptionalInt,
  IsOptionalString,
} from 'src/shared/decorators/validate'

export class UpdateSeoMediaSlotDto {
  @IsOptionalString('Ma slot', 100)
  code?: string

  @IsOptionalString('Ten slot', 255)
  name?: string

  @IsOptionalString('Ma trang', 100)
  pageKey?: string

  @IsOptionalString('Loai slot', 50)
  type?: string

  @IsOptionalString('Mo ta')
  description?: string

  @IsOptionalBoolean('Trang thai kich hoat')
  isActive?: boolean

  @IsOptionalInt('So media toi thieu', 0)
  minItems?: number

  @IsOptionalInt('So media toi da', 1)
  maxItems?: number

  @IsOptionalInt('Chieu rong khuyen nghi', 1)
  recommendedWidth?: number

  @IsOptionalInt('Chieu cao khuyen nghi', 1)
  recommendedHeight?: number

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>
}
