import { MediaType } from 'src/shared/enums'

/**
 * DTO for media view URL response
 */
export class MediaViewResponseDto {
  /**
   * Media ID
   */
  mediaId: number

  /**
   * Presigned URL for viewing media
   */
  viewUrl: string

  /**
   * URL expiration timestamp
   */
  expiresAt: Date

  /**
   * Expiry duration in seconds
   */
  expirySeconds: number

  /**
   * Original filename
   */
  filename: string

  /**
   * MIME type
   */
  mimeType: string

  /**
   * File size in bytes
   */
  fileSize: number

  /**
   * Media type (IMAGE, VIDEO, AUDIO, DOCUMENT, OTHER)
   */
  type: MediaType
}
