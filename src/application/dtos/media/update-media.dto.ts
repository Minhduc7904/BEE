import { IsOptionalIdNumber, IsOptionalEnumValue, IsOptionalString, IsOptionalInt } from 'src/shared/decorators/validate'
import { MediaStatus } from 'src/shared/enums'

/**
 * DTO for updating media metadata
 * 
 * @description Used to update media properties like folder, status, description, dimensions
 */
export class UpdateMediaDto {
  /**
   * Folder ID to move media to
   * @optional
   * @example 10
   */
  @IsOptionalIdNumber('ID thư mục')
  folderId?: number

  /**
   * Media status
   * @optional
   * @example MediaStatus.ACTIVE
   */
  @IsOptionalEnumValue(MediaStatus, 'Trạng thái')
  status?: MediaStatus

  /**
   * Media description
   * @optional
   * @example 'Product image for item XYZ'
   */
  @IsOptionalString('Mô tả')
  description?: string

  /**
   * Alt text for accessibility
   * @optional
   * @example 'A red bicycle on a sunny day'
   */
  @IsOptionalString('Chữ thay thế')
  alt?: string

  /**
   * Image/video width in pixels
   * @optional
   * @example 1920
   */
  @IsOptionalInt('Độ rộng')
  width?: number

  /**
   * Image/video height in pixels
   * @optional
   * @example 1080
   */
  @IsOptionalInt('Độ cao')
  height?: number

  /**
   * Video duration in seconds
   * @optional
   * @example 120
   */
  @IsOptionalInt('Thời lượng')
  duration?: number
}
