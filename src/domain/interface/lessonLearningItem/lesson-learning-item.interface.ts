// src/domain/interface/lessonLearningItem/lesson-learning-item.interface.ts
import { LessonLearningItem } from '../../entities'

export interface CreateLessonLearningItemData {
  lessonId: number
  learningItemId: number
}

export interface LessonLearningItemFilterOptions {
  lessonId?: number
  learningItemId?: number
}

export interface LessonLearningItemPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface LessonLearningItemListResult {
  lessonLearningItems: LessonLearningItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}
