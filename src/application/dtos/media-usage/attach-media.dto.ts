import { IsInt, IsString, IsOptional, IsEnum, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'
import { MediaVisibility } from 'src/shared/enums'

/**
 * AttachMediaDto - Request DTO for attaching media to entity
 */
export class AttachMediaDto {
  @IsInt()
  @Type(() => Number)
  mediaId: number

  @IsString()
  @MaxLength(50)
  entityType: string

  @IsInt()
  @Type(() => Number)
  entityId: number

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fieldName?: string

  @IsOptional()
  @IsEnum(MediaVisibility)
  visibility?: MediaVisibility
}
