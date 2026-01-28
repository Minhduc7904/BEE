import { IsInt, IsString, IsOptional, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'
import { ToNumber } from 'src/shared/decorators'

/**
 * GetMediaUsageListDto - Request DTO for listing media usages
 */
export class GetMediaUsageListDto {
  @IsOptional()
  @IsInt()
  @ToNumber()
  mediaId?: number

  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityType?: string

  @IsOptional()
  @IsInt()
  @ToNumber()
  entityId?: number

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fieldName?: string
}
