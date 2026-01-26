import { IsString, IsNumber, IsOptional } from 'class-validator'

/**
 * DTO for media view request with entity context
 */
export class MediaViewRequestDto {
  /**
   * Entity using the media (COURSE, LESSON, USER, ...)
   */
  @IsString()
  entityType: string

  /**
   * ID of the entity
   */
  @IsNumber()
  entityId: number

  /**
   * Field name where media is used (banner, thumbnail, content, ...)
   */
  @IsString()
  @IsOptional()
  fieldName?: string
}
