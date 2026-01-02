import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaStatus } from '@prisma/client'
import { BaseResponseDto } from '../../dtos'

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
 */
@Injectable()
export class GetMediaViewUrlUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    mediaId: number,
    expirySeconds: number = 3600, // 1 hour default
  ) {
    // Step 1: Validate media exists
    const media = await this.mediaRepository.findById(mediaId)
    
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`)
    }

    // Step 2: Validate media is ready
    if (media.status === MediaStatus.UPLOADING) {
      throw new BadRequestException('Media is still uploading')
    }

    if (media.status === MediaStatus.FAILED) {
      throw new BadRequestException('Media upload failed')
    }

    if (media.status === MediaStatus.DELETED) {
      throw new NotFoundException('Media has been deleted')
    }

    // Step 3: Generate presigned URL for viewing (inline)
    const viewUrl = await this.minioService.getPresignedUrl(
      media.bucketName,
      media.objectKey,
      expirySeconds,
    )

    // Step 4: Return URL with metadata
    const expiresAt = new Date(Date.now() + expirySeconds * 1000)
    
    return BaseResponseDto.success(
      'View URL generated successfully',
      {
        mediaId: media.mediaId,
        viewUrl,
        expiresAt,
        expirySeconds,
        filename: media.originalFilename,
        mimeType: media.mimeType,
        fileSize: media.fileSize,
        type: media.type,
      },
    )
  }
}
