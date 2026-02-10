// src/application/use-cases/videoContent/get-all-video-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IVideoContentRepository, IMediaUsageRepository } from '../../../domain/repositories'
import { VideoContentListQueryDto } from '../../dtos/videoContent/video-content-list-query.dto'
import { VideoContentListResponseDto, VideoContentResponseDto, MediaFileDto } from '../../dtos/videoContent/video-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { FIELD_NAMES } from 'src/shared/constants'
import { MediaStatus } from 'src/shared/enums'

@Injectable()
export class GetAllVideoContentUseCase {
    constructor(
        @Inject('IVideoContentRepository')
        private readonly videoContentRepository: IVideoContentRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly minioService: MinioService,
    ) { }

    async execute(query: VideoContentListQueryDto): Promise<VideoContentListResponseDto> {
        const pagination = {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        const filters = {
            learningItemId: query.learningItemId,
            search: query.search,
        }

        const result = await this.videoContentRepository.findAllWithPagination(pagination, filters)

        // Get media usages for all video contents
        const videoContentDtos = await Promise.all(
            result.videoContents.map(async (item) => {
                // Get media usages for this video content
                const mediaUsages = await this.mediaUsageRepository.findByEntity(
                    EntityType.VIDEO_CONTENT,
                    item.videoContentId,
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

                return VideoContentResponseDto.fromEntity(item, mediaFiles)
            }),
        )

        return BaseResponseDto.success(
            'Video contents retrieved successfully',
            {
                videoContents: videoContentDtos,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            },
        )
    }
}
