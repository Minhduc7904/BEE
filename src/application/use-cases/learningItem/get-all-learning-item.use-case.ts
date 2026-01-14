// src/application/use-cases/learningItem/get-all-learning-item.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ILearningItemRepository } from '../../../domain/repositories'
import { LearningItemListQueryDto } from '../../dtos/learningItem/learning-item-list-query.dto'
import { LearningItemListResponseDto, LearningItemResponseDto } from '../../dtos/learningItem/learning-item.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetAllLearningItemUseCase {
    constructor(
        @Inject('ILearningItemRepository')
        private readonly learningItemRepository: ILearningItemRepository,
    ) { }

    async execute(query: LearningItemListQueryDto): Promise<LearningItemListResponseDto> {
        const pagination = {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        const filters = {
            type: query.type,
            createdBy: query.createdBy,
            competitionId: query.competitionId,
            search: query.search,
        }

        const result = await this.learningItemRepository.findAllWithPagination(pagination, filters)

        const learningItemDtos = result.learningItems.map((item) =>
            LearningItemResponseDto.fromEntity(item),
        )

        return BaseResponseDto.success(
            'Learning items retrieved successfully',
            {
                learningItems: learningItemDtos,
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
