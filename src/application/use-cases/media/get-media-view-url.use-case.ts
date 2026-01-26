import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaStatus, MediaVisibility } from 'src/shared/enums'
import { BaseResponseDto } from '../../dtos'
import { MediaViewRequestDto, MediaViewResponseDto } from '../../dtos/media'

/**
 * GetMediaViewUrlUseCase - Generate presigned URL for viewing/previewing media
 * 
 * DIFFERENCE FROM DOWNLOAD:
 * - Download: Content-Disposition: attachment (forces download)
 * - View: Content-Disposition: inline (opens in browser)
 * 
 * USE CASES:
 * - Preview images in browser
 * - Play videos/audio inline
 * - View PDFs in browser
 * 
 * PERMISSION LOGIC:
 * - Not logged in: Can only view PUBLIC media
 * - Logged in (not uploader): Can view PUBLIC and PROTECTED media
 * - Logged in (is uploader): Can view all visibility levels
 * - DELETED status: Cannot be viewed by anyone
 */
@Injectable()
export class GetMediaViewUrlUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) { }

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

    // Step 2: Check if media is deleted (cannot view deleted media)
    if (media.status === MediaStatus.DELETED) {
      throw new NotFoundException('Media has been deleted and cannot be viewed')
    }

    // Step 3: Validate media is ready
    if (media.status === MediaStatus.UPLOADING) {
      throw new BadRequestException('Media is still uploading')
    }

    if (media.status === MediaStatus.FAILED) {
      throw new BadRequestException('Media upload failed')
    }

    // Step 4: Check media usage and visibility permissions
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
    // If isUploader === true, all visibility levels are allowed

    // Step 6: Generate presigned URL for viewing (inline)
    const viewUrl = await this.minioService.getPresignedUrl(
      media.bucketName,
      media.objectKey,
      expirySeconds,
    )

    // Step 7: Return URL with metadata
    const expiresAt = new Date(Date.now() + expirySeconds * 1000)

    const response: MediaViewResponseDto = {
      mediaId: media.mediaId,
      viewUrl,
      expiresAt,
      expirySeconds,
      filename: media.originalFilename,
      mimeType: media.mimeType,
      fileSize: media.fileSize,
      type: media.type,
    }

    return BaseResponseDto.success(
      'View URL generated successfully',
      response,
    )
  }
}
