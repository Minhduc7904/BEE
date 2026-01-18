// src/application/use-cases/videoContent/get-all-video-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IVideoContentRepository } from '../../../domain/repositories'
import { VideoContentListQueryDto } from '../../dtos/videoContent/video-content-list-query.dto'
import { VideoContentListResponseDto, VideoContentResponseDto } from '../../dtos/videoContent/video-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetAllVideoContentUseCase {
    constructor(
        @Inject('IVideoContentRepository')
        private readonly videoContentRepository: IVideoContentRepository,
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

        const videoContentDtos = result.videoContents.map((item) =>
            VideoContentResponseDto.fromEntity(item),
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
