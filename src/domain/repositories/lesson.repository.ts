// src/domain/repositories/lesson.repository.ts
import { Lesson } from '../entities'
import {
    CreateLessonData,
    UpdateLessonData,
    LessonFilterOptions,
    LessonPaginationOptions,
    LessonListResult,
} from '../interface/lesson/lesson.interface'

export interface ILessonRepository {
    create(data: CreateLessonData): Promise<Lesson>
    findById(id: number): Promise<Lesson | null>
    update(id: number, data: UpdateLessonData): Promise<Lesson>
    delete(id: number): Promise<boolean>
    findAll(): Promise<Lesson[]>

    // Pagination methods
    findAllWithPagination(
        pagination: LessonPaginationOptions,
        filters?: LessonFilterOptions,
    ): Promise<LessonListResult>

    // Search methods
    searchLessons(searchTerm: string, pagination?: LessonPaginationOptions): Promise<LessonListResult>

    // Filter methods
    findByFilters(filters: LessonFilterOptions, pagination?: LessonPaginationOptions): Promise<LessonListResult>
    findByCourse(courseId: number): Promise<Lesson[]>
    findByTeacher(teacherId: number): Promise<Lesson[]>

    // Count methods
    count(filters?: LessonFilterOptions): Promise<number>
    countByCourse(courseId: number): Promise<number>
    countByTeacher(teacherId: number): Promise<number>
}
