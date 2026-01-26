import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaStatus } from 'src/shared/enums'
import { BaseResponseDto } from '../../dtos'
import { MediaViewResponseDto } from '../../dtos/media'

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
export class GetMyMediaViewUrlUseCase {
    constructor(
        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,
        private readonly minioService: MinioService,
    ) { }

    async execute(params: {
        mediaId: number
        userId?: number
        expirySeconds?: number
    }) {
        const { mediaId, userId, expirySeconds = 3600 } = params

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

        if (media.uploadedBy !== userId) {
            throw new ForbiddenException('You do not have permission to view this media')
        }

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
