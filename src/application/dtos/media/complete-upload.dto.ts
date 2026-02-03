import { IsRequiredIdNumber, IsOptionalString, IsOptionalInt } from 'src/shared/decorators/validate'

/**
 * DTO for completing presigned upload
 * 
 * @description Frontend calls this after successfully uploading to MinIO to finalize the upload
 */
export class CompleteUploadDto {
  /**
   * Media ID returned from presigned upload request
   * @required
   * @example 123
   */
  @IsRequiredIdNumber('ID media')
  mediaId: number

  /**
   * ETag returned by MinIO after upload (for verification)
   * @optional
   * @example '"d41d8cd98f00b204e9800998ecf8427e"'
   */
  @IsOptionalString('ETag')
  etag?: string

  /**
   * Actual file size uploaded (for verification against expected size)
   * @optional
   * @example 1024000
   */
  @IsOptionalInt('Kích thước đã tải lên')
  uploadedSize?: number
}
