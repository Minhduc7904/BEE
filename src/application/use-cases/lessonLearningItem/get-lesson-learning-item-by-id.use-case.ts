// src/application/use-cases/lessonLearningItem/get-lesson-learning-item-by-id.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { ILessonLearningItemRepository } from '../../../domain/repositories'
import { LessonLearningItemResponseDto } from '../../dtos/lessonLearningItem/lesson-learning-item.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetLessonLearningItemByIdUseCase {
    constructor(
        @Inject('ILessonLearningItemRepository')
        private readonly lessonLearningItemRepository: ILessonLearningItemRepository,
    ) { }

    async execute(lessonId: number, learningItemId: number): Promise<BaseResponseDto<LessonLearningItemResponseDto>> {
        const lessonLearningItem = await this.lessonLearningItemRepository.findByCompositeId(lessonId, learningItemId)

        if (!lessonLearningItem) {
            throw new NotFoundException(
                `Lesson learning item with lessonId ${lessonId} and learningItemId ${learningItemId} not found`,
            )
        }

        const dto = LessonLearningItemResponseDto.fromEntity(lessonLearningItem)

        return BaseResponseDto.success('Lesson learning item retrieved successfully', dto)
    }
}
