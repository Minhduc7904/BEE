import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaStatus } from 'src/shared/enums'
import { BaseResponseDto } from '../../dtos'
import { MediaViewResponseDto } from '../../dtos/media'

@Injectable()
export class GetAdminMediaViewUrlUseCase {
    constructor(
        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,
        private readonly minioService: MinioService,
    ) { }

    async execute(params: {
        mediaId: number
        expirySeconds?: number
    }) {
        const { mediaId, expirySeconds = 3600 } = params

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
