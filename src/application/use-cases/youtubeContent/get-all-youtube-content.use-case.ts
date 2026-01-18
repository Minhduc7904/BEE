// src/application/use-cases/youtubeContent/get-all-youtube-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IYoutubeContentRepository } from '../../../domain/repositories'
import { YoutubeContentListQueryDto } from '../../dtos/youtubeContent/youtube-content-list-query.dto'
import { YoutubeContentListResponseDto, YoutubeContentResponseDto } from '../../dtos/youtubeContent/youtube-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetAllYoutubeContentUseCase {
    constructor(
        @Inject('IYoutubeContentRepository')
        private readonly youtubeContentRepository: IYoutubeContentRepository,
    ) { }

    async execute(query: YoutubeContentListQueryDto): Promise<YoutubeContentListResponseDto> {
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

        const result = await this.youtubeContentRepository.findAllWithPagination(pagination, filters)

        const youtubeContentDtos = result.youtubeContents.map((item) =>
            YoutubeContentResponseDto.fromEntity(item),
        )

        return BaseResponseDto.success(
            'Youtube contents retrieved successfully',
            {
                youtubeContents: youtubeContentDtos,
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
