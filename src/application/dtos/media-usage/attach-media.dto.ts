import { IsRequiredIdNumber, IsRequiredString, IsOptionalString, IsOptionalEnumValue } from 'src/shared/decorators/validate'
import { MediaVisibility } from 'src/shared/enums'
import { EntityType } from 'src/shared/constants/entity-type.constants'

/**
 * DTO for attaching media to entity
 * 
 * @description Used to link media files to other entities (e.g., courses, lessons, questions)
 */
export class AttachMediaDto {
  /**
   * Media ID to attach
   * @required
   * @example 123
   */
  @IsRequiredIdNumber('ID media')
  mediaId: number

  /**
   * Entity type to attach to
   * @required
   * @example 'course'
   */
  @IsRequiredString('Loại thực thể', 50)
  entityType: EntityType

  /**
   * Entity ID to attach to
   * @required
   * @example 456
   */
  @IsRequiredIdNumber('ID thực thể')
  entityId: number

  /**
   * Field name in entity
   * @optional
   * @example 'thumbnailImage'
   */
  @IsOptionalString('Tên trường', 100)
  fieldName?: string

  /**
   * Media visibility
   * @optional
   * @example MediaVisibility.PUBLIC
   */
  @IsOptionalEnumValue(MediaVisibility, 'Độ hiển thị')
  visibility?: MediaVisibility
}
