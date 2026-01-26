/**
 * Response DTO for presigned upload
 * Contains presigned URL and upload identifier
 */
export class PresignedUploadResponseDto {
  /**
   * Presigned URL for direct upload to MinIO
   * Frontend should PUT file to this URL
   */
  uploadUrl: string

  /**
   * Media ID for tracking and completion
   */
  mediaId: number

  /**
   * Bucket name where file will be stored
   */
  bucketName: string

  /**
   * Object key (path) in storage
   */
  objectKey: string

  /**
   * URL expiration time (seconds from now)
   */
  expiresIn: number

  /**
   * Additional metadata for frontend validation
   */
  metadata: {
    originalFilename: string
    mimeType: string
    fileSize: number
    type: string
  }

  constructor(partial: Partial<PresignedUploadResponseDto>) {
    Object.assign(this, partial)
  }

  static create(data: {
    uploadUrl: string
    mediaId: number
    bucketName: string
    objectKey: string
    expiresIn: number
    originalFilename: string
    mimeType: string
    fileSize: number
    type: string
  }): PresignedUploadResponseDto {
    return new PresignedUploadResponseDto({
      uploadUrl: data.uploadUrl,
      mediaId: data.mediaId,
      bucketName: data.bucketName,
      objectKey: data.objectKey,
      expiresIn: data.expiresIn,
      metadata: {
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        type: data.type,
      },
    })
  }
}
