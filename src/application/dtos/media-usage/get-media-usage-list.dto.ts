import { IsOptionalIdNumber, IsOptionalString } from 'src/shared/decorators/validate'
import { EntityType } from 'src/shared/constants/entity-type.constants'

/**
 * DTO for listing media usages
 * 
 * @description Request DTO for querying media usage records with filters
 */
export class GetMediaUsageListDto {
  /**
   * Filter by media ID
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('ID media')
  mediaId?: number

  /**
   * Filter by entity type (max 50 characters)
   * @optional
   * @example EntityType.COURSE
   */
  @IsOptionalString('Loại thực thể', 50)
  entityType?: EntityType

  /**
   * Filter by entity ID
   * @optional
   * @example 10
   */
  @IsOptionalIdNumber('ID thực thể')
  entityId?: number

  /**
   * Filter by field name (max 100 characters)
   * @optional
   * @example 'avatar'
   */
  @IsOptionalString('Tên field', 100)
  fieldName?: string
}
