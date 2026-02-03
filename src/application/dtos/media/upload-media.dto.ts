import { IsOptionalIdNumber, IsOptionalString, IsOptionalEnumValue, IsOptionalInt } from 'src/shared/decorators/validate'
import { MediaType } from 'src/shared/enums'

/**
 * DTO for uploading media (direct upload)
 * 
 * @description Used for direct media upload with metadata
 */
export class UploadMediaDto {
  /**
   * Folder ID to upload to
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('ID thư mục')
  folderId?: number

  /**
   * Media description
   * @optional
   * @example 'Lesson 1 diagram'
   */
  @IsOptionalString('Mô tả')
  description?: string

  /**
   * Alt text for accessibility
   * @optional
   * @example 'Diagram showing the water cycle'
   */
  @IsOptionalString('Chữ thay thế')
  alt?: string

  /**
   * Media type
   * @optional
   * @example MediaType.IMAGE
   */
  @IsOptionalEnumValue(MediaType, 'Loại media')
  type?: MediaType

  /**
   * Image/video width in pixels (minimum 0)
   * @optional
   * @example 1920
   */
  @IsOptionalInt('Độ rộng', 0)
  width?: number

  /**
   * Image/video height in pixels (minimum 0)
   * @optional
   * @example 1080
   */
  @IsOptionalInt('Độ cao', 0)
  height?: number

  /**
   * Video duration in seconds (minimum 0)
   * @optional
   * @example 120
   */
  @IsOptionalInt('Thời lượng', 0)
  duration?: number
}
