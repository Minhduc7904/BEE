import { IsRequiredString, IsRequiredNumber, IsOptionalEnumValue, IsOptionalIdNumber, IsOptionalInt } from 'src/shared/decorators/validate'
import { MediaType } from '../../../shared/enums'

/**
 * DTO for requesting presigned upload URL
 * 
 * @description Frontend sends file metadata before actual upload to get presigned URL
 */
export class CreatePresignedUploadDto {
  /**
   * Original filename
   * @required
   * @example 'document.pdf'
   */
  @IsRequiredString('Tên file gốc')
  originalFilename: string

  /**
   * MIME type
   * @required
   * @example 'application/pdf'
   */
  @IsRequiredString('Loại MIME')
  mimeType: string

  /**
   * File size in bytes (minimum 1)
   * @required
   * @example 1024000
   */
  @IsRequiredNumber('Kích thước file', 1)
  fileSize: number

  /**
   * Media type
   * @optional
   * @example MediaType.IMAGE
   */
  @IsOptionalEnumValue(MediaType, 'Loại media')
  type?: MediaType

  /**
   * Folder ID to upload to
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('ID thư mục')
  folderId?: number

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
