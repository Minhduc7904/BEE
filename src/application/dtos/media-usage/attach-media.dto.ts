import { IsInt, IsString, IsOptional, IsEnum, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'
import { MediaVisibility } from 'src/shared/enums'
import { ToNumber } from 'src/shared/decorators'
import { EntityType } from 'src/shared/constants/entity-type.constants'
/**
 * AttachMediaDto - Request DTO for attaching media to entity
 */
export class AttachMediaDto {
  @IsInt()
  @ToNumber()
  mediaId: number

  @IsString()
  @MaxLength(50)
  entityType: EntityType

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
