import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaStatus } from '@prisma/client'
import { BaseResponseDto } from '../../dtos'

/**
 * GetMediaDownloadUrlUseCase - Generate presigned download URL for media
 * 
 * RESPONSIBILITIES:
 * ✅ Validate media exists and is ready
 * ✅ Generate presigned download URL (private bucket access)
 * ✅ Return URL with expiry information
 * 
 * NOT RESPONSIBLE FOR:
 * ❌ File upload (see UploadMediaUseCase)
 * ❌ MediaUsage attachment (see AttachMediaUseCase)
 * ❌ Detailed authorization (handled at Guard/Middleware layer)
 * 
 * ARCHITECTURE:
 * - Application layer use case
 * - Calls IMediaRepository for media lookup
 * - Calls MinioService to generate presigned URL
 * - Returns ephemeral download URL (time-limited)
 * 
 * SECURITY:
 * - All buckets are PRIVATE
 * - Access control via presigned URLs only
 * - URLs expire after configurable time (default 1 hour)
 * - Additional authorization can be added via MediaUsage checks
 */
@Injectable()
export class GetMediaDownloadUrlUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) {}

  /**
   * Generate download URL for media
   * 
   * @param mediaId - Media ID
   * @param expirySeconds - URL expiry time in seconds (default: 1 hour)
   * @returns Presigned download URL with metadata
   */
  async execute(
    mediaId: number,
    expirySeconds: number = 3600, // 1 hour default
  ) {
    // Step 1: Validate media exists
    const media = await this.mediaRepository.findById(mediaId)
    
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`)
    }

    // Step 2: Validate media is ready for download
    if (media.status === MediaStatus.UPLOADING) {
      throw new BadRequestException('Media is still uploading')
    }

    if (media.status === MediaStatus.FAILED) {
      throw new BadRequestException('Media upload failed, cannot download')
    }

    if (media.status === MediaStatus.DELETED) {
      throw new NotFoundException('Media has been deleted')
    }

    // Step 3: Generate presigned download URL
    // URL is temporary and expires after specified time
    const downloadUrl = await this.minioService.getPresignedDownloadUrl(
      media.bucketName,
      media.objectKey,
      expirySeconds,
      media.originalFilename, // Use original filename for Content-Disposition
    )

    // Step 4: Return URL with metadata
    const expiresAt = new Date(Date.now() + expirySeconds * 1000)
    
    return BaseResponseDto.success(
      'Download URL generated successfully',
      {
        mediaId: media.mediaId,
        downloadUrl,
        expiresAt,
        expirySeconds,
        filename: media.originalFilename,
        mimeType: media.mimeType,
        fileSize: media.fileSize,
        // Note: Do not expose bucketName/objectKey to client for security
      },
    )
  }

  /**
   * Generate download URL with custom filename
   * Useful for downloading with different filename than original
   * 
   * @param mediaId - Media ID
   * @param customFilename - Custom filename for download
   * @param expirySeconds - URL expiry time
   * @returns Presigned download URL
   */
  async executeWithCustomFilename(
    mediaId: number,
    customFilename: string,
    expirySeconds: number = 3600,
  ) {
    const media = await this.mediaRepository.findById(mediaId)
    
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`)
    }

    if (media.status !== MediaStatus.READY) {
      throw new BadRequestException('Media is not ready for download')
    }

    const downloadUrl = await this.minioService.getPresignedDownloadUrl(
      media.bucketName,
      media.objectKey,
      expirySeconds,
      customFilename, // Use custom filename
    )

    const expiresAt = new Date(Date.now() + expirySeconds * 1000)
    
    return BaseResponseDto.success(
      'Download URL generated successfully',
      {
        mediaId: media.mediaId,
        downloadUrl,
        expiresAt,
        expirySeconds,
        filename: customFilename,
        mimeType: media.mimeType,
        fileSize: media.fileSize,
      },
    )
  }
}
