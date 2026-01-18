// src/application/use-cases/homeworkContent/get-all-homework-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IHomeworkContentRepository } from '../../../domain/repositories'
import { HomeworkContentListQueryDto } from '../../dtos/homeworkContent/homework-content-list-query.dto'
import { HomeworkContentListResponseDto, HomeworkContentResponseDto } from '../../dtos/homeworkContent/homework-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetAllHomeworkContentUseCase {
    constructor(
        @Inject('IHomeworkContentRepository')
        private readonly homeworkContentRepository: IHomeworkContentRepository,
    ) { }

    async execute(query: HomeworkContentListQueryDto): Promise<HomeworkContentListResponseDto> {
        const pagination = {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        const filters = {
            learningItemId: query.learningItemId,
            competitionId: query.competitionId,
            allowLateSubmit: query.allowLateSubmit,
            search: query.search,
        }

        const result = await this.homeworkContentRepository.findAllWithPagination(pagination, filters)

        const homeworkContentDtos = result.homeworkContents.map((item) =>
            HomeworkContentResponseDto.fromEntity(item),
        )

        return BaseResponseDto.success(
            'Homework contents retrieved successfully',
            {
                homeworkContents: homeworkContentDtos,
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
