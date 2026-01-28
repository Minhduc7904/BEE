import { IsInt, IsString, IsOptional, IsEnum, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'
import { MediaVisibility } from 'src/shared/enums'
import { ToNumber } from 'src/shared/decorators'

/**
 * AttachMediaDto - Request DTO for attaching media to entity
 */
export class AttachMediaDto {
  @IsInt()
  @ToNumber()
  mediaId: number

  @IsString()
  @MaxLength(50)
  entityType: string

  @IsInt()
  @ToNumber()
  entityId: number

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fieldName?: string

  @IsOptional()
  @IsEnum(MediaVisibility)
  visibility?: MediaVisibility
}
