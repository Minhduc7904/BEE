// src/application/use-cases/lessonLearningItem/get-all-lesson-learning-item.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ILessonLearningItemRepository } from '../../../domain/repositories'
import { LessonLearningItemListQueryDto } from '../../dtos/lessonLearningItem/lesson-learning-item-list-query.dto'
import { LessonLearningItemListResponseDto, LessonLearningItemResponseDto } from '../../dtos/lessonLearningItem/lesson-learning-item.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetAllLessonLearningItemUseCase {
    constructor(
        @Inject('ILessonLearningItemRepository')
        private readonly lessonLearningItemRepository: ILessonLearningItemRepository,
    ) { }

    async execute(query: LessonLearningItemListQueryDto): Promise<LessonLearningItemListResponseDto> {
        const pagination = {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        const filters = {
            lessonId: query.lessonId,
            learningItemId: query.learningItemId,
        }

        const result = await this.lessonLearningItemRepository.findAllWithPagination(pagination, filters)

        const lessonLearningItemDtos = result.lessonLearningItems.map((item) =>
            LessonLearningItemResponseDto.fromEntity(item),
        )

        return BaseResponseDto.success(
            'Lesson learning items retrieved successfully',
            {
                lessonLearningItems: lessonLearningItemDtos,
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
