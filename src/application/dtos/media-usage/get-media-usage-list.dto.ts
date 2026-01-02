import { IsInt, IsString, IsOptional, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * GetMediaUsageListDto - Request DTO for listing media usages
 */
export class GetMediaUsageListDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  mediaId?: number

  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityType?: string

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  entityId?: number

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fieldName?: string
}
