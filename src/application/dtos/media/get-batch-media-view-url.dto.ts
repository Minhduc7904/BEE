import { IsArray, ArrayMinSize, ArrayMaxSize, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class GetBatchMediaViewUrlDto {
  @IsArray({ message: VALIDATION_MESSAGES.FIELD_INVALID('Danh sách ID') })
  @ArrayMinSize(1, { message: VALIDATION_MESSAGES.FIELD_MIN('Danh sách ID', 1) })
  @ArrayMaxSize(100, { message: VALIDATION_MESSAGES.FIELD_MAX('Danh sách ID', 100) })
  @IsNumber({}, { each: true, message: VALIDATION_MESSAGES.FIELD_INVALID('ID media') })
  @Type(() => Number)
  mediaIds: number[]
}
