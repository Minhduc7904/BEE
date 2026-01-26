import { IsInt, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for completing presigned upload
 * Frontend calls this after successfully uploading to MinIO
 */
export class CompleteUploadDto {
  @IsInt()
  @Type(() => Number)
  mediaId: number

  /**
   * Optional: ETag returned by MinIO after upload
   * Can be used for verification
   */
  @IsString()
  @IsOptional()
  etag?: string

  /**
   * Optional: Actual file size uploaded
   * For verification against expected size
   */
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  uploadedSize?: number
}
