import { IsOptionalIdNumber, IsOptionalEnumValue, IsOptionalString } from 'src/shared/decorators/validate'
import { MediaType, MediaStatus } from 'src/shared/enums'
import { ListQueryDto } from '../pagination/list-query.dto'

/**
 * DTO for querying media list with filters
 * 
 * @description Extends ListQueryDto with media-specific filters
 */
export class GetMediaListDto extends ListQueryDto {
  /**
   * Filter by folder ID
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('ID thư mục')
  folderId?: number

  /**
   * Filter by media type
   * @optional
   * @example MediaType.IMAGE
   */
  @IsOptionalEnumValue(MediaType, 'Loại media')
  type?: MediaType

  /**
   * Filter by status
   * @optional
   * @example MediaStatus.ACTIVE
   */
  @IsOptionalEnumValue(MediaStatus, 'Trạng thái')
  status?: MediaStatus

  /**
   * Filter by uploader ID
   * @optional
   * @example 10
   */
  @IsOptionalIdNumber('Người tải lên')
  uploadedBy?: number

  /**
   * Filter by bucket name
   * @optional
   * @example 'my-bucket'
   */
  @IsOptionalString('Tên bucket')
  bucketName?: string
}
