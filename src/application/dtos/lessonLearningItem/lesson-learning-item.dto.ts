// src/application/dtos/lessonLearningItem/lesson-learning-item.dto.ts
import { LessonLearningItem } from '../../../domain/entities'
import { BaseResponseDto } from '../common/base-response.dto'
import { LessonResponseDto } from '../lesson/lesson.dto'
import { LearningItemResponseDto } from '../learningItem/learning-item.dto'

export class LessonLearningItemResponseDto {
    lessonId: number
    learningItemId: number
    createdAt: Date
    lesson?: LessonResponseDto
    learningItem?: LearningItemResponseDto

    static fromEntity(lessonLearningItem: LessonLearningItem): LessonLearningItemResponseDto {
        const dto = new LessonLearningItemResponseDto()
        dto.lessonId = lessonLearningItem.lessonId
        dto.learningItemId = lessonLearningItem.learningItemId
        dto.createdAt = lessonLearningItem.createdAt
        
        if (lessonLearningItem.lesson) {
            dto.lesson = LessonResponseDto.fromEntity(lessonLearningItem.lesson)
        }

        if (lessonLearningItem.learningItem) {
            dto.learningItem = LearningItemResponseDto.fromEntity(lessonLearningItem.learningItem)
        }

        return dto
    }
}

export class LessonLearningItemListResponseDto extends BaseResponseDto<{
    lessonLearningItems: LessonLearningItemResponseDto[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> { }
