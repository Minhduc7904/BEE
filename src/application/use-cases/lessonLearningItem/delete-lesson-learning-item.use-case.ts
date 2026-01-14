// src/application/use-cases/lessonLearningItem/delete-lesson-learning-item.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { ILessonLearningItemRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class DeleteLessonLearningItemUseCase {
    constructor(
        @Inject('ILessonLearningItemRepository')
        private readonly lessonLearningItemRepository: ILessonLearningItemRepository,
    ) { }

    async execute(lessonId: number, learningItemId: number): Promise<BaseResponseDto<null>> {
        const existingLessonLearningItem = await this.lessonLearningItemRepository.findByCompositeId(
            lessonId,
            learningItemId,
        )

        if (!existingLessonLearningItem) {
            throw new NotFoundException(
                `Lesson learning item with lessonId ${lessonId} and learningItemId ${learningItemId} not found`,
            )
        }

        await this.lessonLearningItemRepository.delete(lessonId, learningItemId)

        return BaseResponseDto.success('Lesson learning item deleted successfully', null)
    }
}
