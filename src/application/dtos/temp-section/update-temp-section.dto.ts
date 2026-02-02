// src/application/dtos/temp-section/update-temp-section.dto.ts
import { IsString, IsOptional, IsNumber, MinLength, MaxLength } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class UpdateTempSectionDto {
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tiêu đề section') })
  @MinLength(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Tiêu đề', 1) })
  @MaxLength(255, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Tiêu đề', 255) })
  @Trim()
  title?: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mô tả') })
  @Trim()
  description?: string

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Thứ tự') })
  order?: number

  @IsOptional()
  metadata?: any
}
