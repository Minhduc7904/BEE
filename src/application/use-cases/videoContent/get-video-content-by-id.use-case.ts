// src/application/use-cases/videoContent/get-video-content-by-id.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IVideoContentRepository, IMediaUsageRepository } from '../../../domain/repositories'
import { VideoContentResponseDto, MediaFileDto } from '../../dtos/videoContent/video-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { FIELD_NAMES } from 'src/shared/constants'
import { MediaStatus } from 'src/shared/enums'

@Injectable()
export class GetVideoContentByIdUseCase {
    constructor(
        @Inject('IVideoContentRepository')
        private readonly videoContentRepository: IVideoContentRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly minioService: MinioService,
    ) { }

    async execute(id: number): Promise<BaseResponseDto<VideoContentResponseDto>> {
        const videoContent = await this.videoContentRepository.findById(id)

        if (!videoContent) {
            throw new NotFoundException(`Video content with ID ${id} not found`)
        }

        // Get media usages for this video content
        const mediaUsages = await this.mediaUsageRepository.findByEntity(
            EntityType.VIDEO_CONTENT,
            id,
            FIELD_NAMES.VIDEO_FILE,
        )

        // Generate viewUrl for each media
        const mediaFiles: MediaFileDto[] = await Promise.all(
            mediaUsages.map(async (usage) => {
                const media = usage.media
                if (!media) {
                    return null
                }

                const mediaFile: MediaFileDto = {
                    mediaId: media.mediaId,
                    filename: media.originalFilename,
                    type: media.type,
                }

                // Generate viewUrl if media is ready
                if (media.status === MediaStatus.READY) {
                    try {
                        const viewUrl = await this.minioService.getPresignedUrl(
                            media.bucketName,
                            media.objectKey,
                            3600, // 1 hour expiry
                        )
                        mediaFile.viewUrl = viewUrl
                    } catch (error) {
                        console.error(`Failed to generate viewUrl for media ${media.mediaId}:`, error)
                    }
                }

                return mediaFile
            }),
        ).then(files => files.filter(f => f !== null) as MediaFileDto[])

        const dto = VideoContentResponseDto.fromEntity(videoContent, mediaFiles)
        return BaseResponseDto.success('Video content retrieved successfully', dto)
    }
}
