// src/domain/repositories/lesson-learning-item.repository.ts
import { LessonLearningItem } from '../entities'
import {
    CreateLessonLearningItemData,
    LessonLearningItemFilterOptions,
    LessonLearningItemPaginationOptions,
    LessonLearningItemListResult,
} from '../interface/lessonLearningItem/lesson-learning-item.interface'

export interface ILessonLearningItemRepository {
    create(data: CreateLessonLearningItemData): Promise<LessonLearningItem>
    findByCompositeId(lessonId: number, learningItemId: number): Promise<LessonLearningItem | null>
    delete(lessonId: number, learningItemId: number): Promise<boolean>
    findAll(): Promise<LessonLearningItem[]>

    // Pagination methods
    findAllWithPagination(
        pagination: LessonLearningItemPaginationOptions,
        filters?: LessonLearningItemFilterOptions,
    ): Promise<LessonLearningItemListResult>

    // Filter methods
    findByLesson(lessonId: number): Promise<LessonLearningItem[]>
    findByLearningItem(learningItemId: number): Promise<LessonLearningItem[]>
    findByFilters(filters: LessonLearningItemFilterOptions): Promise<LessonLearningItem[]>

    // Count methods
    count(filters?: LessonLearningItemFilterOptions): Promise<number>
    countByLesson(lessonId: number): Promise<number>
    countByLearningItem(learningItemId: number): Promise<number>

    // Bulk operations
    deleteByLesson(lessonId: number): Promise<number>
    deleteByLearningItem(learningItemId: number): Promise<number>
    bulkCreate(data: CreateLessonLearningItemData[]): Promise<LessonLearningItem[]>
}
