// src/domain/repositories/course-class.repository.ts
import { CourseClass } from '../entities/course-class/course-class.entity'
import {
    CreateCourseClassData,
    UpdateCourseClassData,
    CourseClassFilterOptions,
    CourseClassPaginationOptions,
    CourseClassListResult,
} from '../interface/course-class/course-class.interface'

export interface ICourseClassRepository {
    // Basic CRUD
    create(data: CreateCourseClassData): Promise<CourseClass>
    findById(id: number): Promise<CourseClass | null>
    update(id: number, data: UpdateCourseClassData): Promise<CourseClass>
    delete(id: number): Promise<boolean>
    findAll(): Promise<CourseClass[]>

    // Pagination methods (CHUẨN GIỐNG CourseRepo)
    findAllWithPagination(
        pagination: CourseClassPaginationOptions,
        filters?: CourseClassFilterOptions,
    ): Promise<CourseClassListResult>

    // Query methods (DOMAIN-LEVEL)
    findByCourse(courseId: number): Promise<CourseClass[]>
    findByInstructor(instructorId: number): Promise<CourseClass[]>
    // findByDateRange(startDate: Date, endDate: Date): Promise<CourseClass[]>

    // Count methods
    count(filters?: CourseClassFilterOptions): Promise<number>
    countByCourse(courseId: number): Promise<number>
    countByInstructor(instructorId: number): Promise<number>
}
