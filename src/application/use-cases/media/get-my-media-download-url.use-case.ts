import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaStatus } from 'src/shared/enums'
import { BaseResponseDto } from '../../dtos'
import { MediaDownloadResponseDto } from '../../dtos/media'

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
export class GetMyMediaDownloadUrlUseCase {
    constructor(
        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,
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
        userId?: number
        expirySeconds?: number
    }) {
        const { mediaId, userId, expirySeconds = 3600 } = params

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
}
