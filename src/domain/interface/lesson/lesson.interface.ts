// src/domain/interface/lesson/lesson.interface.ts
import { Lesson } from '../../entities'

export interface CreateLessonData {
  courseId: number
  title: string
  description?: string
  teacherId?: number
}

export interface UpdateLessonData {
  title?: string
  description?: string
  teacherId?: number
}

export interface LessonFilterOptions {
  courseId?: number
  teacherId?: number
  search?: string
}

export interface LessonPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface LessonSortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface LessonListResult {
  lessons: Lesson[]
  total: number
  page: number
  limit: number
  totalPages: number
}
