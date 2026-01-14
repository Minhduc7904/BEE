// src/infrastructure/mappers/lesson-learning-item.mapper.ts
import { LessonLearningItem } from '../../domain/entities'
import { LessonMapper } from './lesson.mapper'
import { LearningItemMapper } from './learning-item.mapper'

/**
 * Mapper class để convert từ Prisma LessonLearningItem models sang Domain LessonLearningItem entities
 */
export class LessonLearningItemMapper {
    /**
     * Convert Prisma LessonLearningItem model sang Domain LessonLearningItem entity
     */
    static toDomainLessonLearningItem(prismaLessonLearningItem: any): LessonLearningItem | undefined {
        if (!prismaLessonLearningItem) return undefined

        return new LessonLearningItem({
            lessonId: prismaLessonLearningItem.lessonId,
            learningItemId: prismaLessonLearningItem.learningItemId,
            createdAt: prismaLessonLearningItem.createdAt,
            lesson: prismaLessonLearningItem.lesson 
                ? LessonMapper.toDomainLesson(prismaLessonLearningItem.lesson) 
                : undefined,
            learningItem: prismaLessonLearningItem.learningItem 
                ? LearningItemMapper.toDomainLearningItem(prismaLessonLearningItem.learningItem) 
                : undefined,
        })
    }

    /**
     * Convert array của Prisma LessonLearningItems sang array của Domain LessonLearningItems
     */
    static toDomainLessonLearningItems(prismaLessonLearningItems: any[]): LessonLearningItem[] {
        return prismaLessonLearningItems
            .map((item) => this.toDomainLessonLearningItem(item))
            .filter(Boolean) as LessonLearningItem[]
    }
}
