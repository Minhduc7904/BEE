import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaStatus, MediaVisibility } from 'src/shared/enums'
import { BaseResponseDto } from '../../dtos'
import { MediaViewRequestDto, MediaDownloadResponseDto } from '../../dtos/media'

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
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) { }

  /**
   * Generate download URL for media
   * 
   * @param mediaId - Media ID
   * @param expirySeconds - URL expiry time in seconds (default: 1 hour)
   * @returns Presigned download URL with metadata
   */
  async execute(params: {
    mediaId: number
    context: MediaViewRequestDto
    userId?: number
    expirySeconds?: number
  }) {
    const { mediaId, context, userId, expirySeconds = 3600 } = params

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

    const usage = await this.mediaUsageRepository.findOnlyByContext({
      entityType: context.entityType,
      entityId: context.entityId,
      fieldName: context.fieldName,
      mediaId: mediaId,
    })
    
    if (!usage) {
      throw new NotFoundException(
        `Media ${mediaId} is not attached to ${context.entityType} ${context.entityId}${context.fieldName ? ` (field: ${context.fieldName})` : ''}`
      )
    }
    // Step 5: Check visibility permissions
    const isUploader = userId && media.uploadedBy === userId
    const visibility = usage.visibility || MediaVisibility.PRIVATE
    if (!userId) {
      // Not logged in - only PUBLIC allowed
      if (visibility !== MediaVisibility.PUBLIC) {
        throw new ForbiddenException('This media requires authentication to view')
      }
    } else if (!isUploader) {
      // Logged in but not the uploader - PUBLIC and PROTECTED allowed
      if (visibility === MediaVisibility.PRIVATE) {
        throw new ForbiddenException('You do not have permission to view this media')
      }
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
    const response: MediaDownloadResponseDto = {
      mediaId: media.mediaId,
      downloadUrl,
      expiresAt,
      expirySeconds,
      filename: media.originalFilename,
      mimeType: media.mimeType,
      fileSize: media.fileSize,
      type: media.type,
    }
    return BaseResponseDto.success(
      'Download URL generated successfully',
      response,
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
