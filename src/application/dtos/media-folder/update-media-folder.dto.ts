import { IsOptionalString, IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO for updating media folder
 * 
 * @description Used to update an existing folder's properties
 */
export class UpdateMediaFolderDto {
  /**
   * Folder name
   * @optional
   * @example 'Updated Course Images'
   */
  @IsOptionalString('Tên thư mục', 255)
  name?: string

  /**
   * URL-friendly slug
   * @optional
   * @example 'updated-course-images'
   */
  @IsOptionalString('Slug', 255)
  slug?: string

  /**
   * Folder description
   * @optional
   * @example 'Updated: Images used in course materials'
   */
  @IsOptionalString('Mô tả')
  description?: string

  /**
   * Parent folder ID (for moving folder)
   * @optional
   * @example 10
   */
  @IsOptionalIdNumber('ID thư mục cha')
  parentId?: number
}
