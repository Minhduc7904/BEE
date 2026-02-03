import { IsRequiredString, IsOptionalString, IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO for creating media folder
 * 
 * @description Used to create a new folder in the media library
 */
export class CreateMediaFolderDto {
  /**
   * Folder name
   * @required
   * @example 'Course Images'
   */
  @IsRequiredString('Tên thư mục', 255)
  name: string

  /**
   * URL-friendly slug
   * @required
   * @example 'course-images'
   */
  @IsRequiredString('Slug', 255)
  slug: string

  /**
   * Folder description
   * @optional
   * @example 'Images used in course materials'
   */
  @IsOptionalString('Mô tả')
  description?: string

  /**
   * Parent folder ID (for nested folders)
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('ID thư mục cha')
  parentId?: number
}
