// src/application/use-cases/lessonLearningItem/create-lesson-learning-item.use-case.ts
import { Injectable, Inject, ConflictException } from '@nestjs/common'
import type { ILessonLearningItemRepository } from '../../../domain/repositories'
import { CreateLessonLearningItemDto } from '../../dtos/lessonLearningItem/create-lesson-learning-item.dto'
import { LessonLearningItemResponseDto } from '../../dtos/lessonLearningItem/lesson-learning-item.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class CreateLessonLearningItemUseCase {
    constructor(
        @Inject('ILessonLearningItemRepository')
        private readonly lessonLearningItemRepository: ILessonLearningItemRepository,
    ) { }

    async execute(dto: CreateLessonLearningItemDto): Promise<BaseResponseDto<LessonLearningItemResponseDto>> {
        // Check if already exists
        const existing = await this.lessonLearningItemRepository.findByCompositeId(dto.lessonId, dto.learningItemId)
        if (existing) {
            throw new ConflictException(
                `Lesson learning item with lessonId ${dto.lessonId} and learningItemId ${dto.learningItemId} already exists`,
            )
        }

        const lessonLearningItem = await this.lessonLearningItemRepository.create({
            lessonId: dto.lessonId,
            learningItemId: dto.learningItemId,
        })

        const responseDto = LessonLearningItemResponseDto.fromEntity(lessonLearningItem)

        return BaseResponseDto.success('Lesson learning item created successfully', responseDto)
    }
}
