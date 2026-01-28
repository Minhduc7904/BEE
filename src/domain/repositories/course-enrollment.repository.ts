// src/domain/repositories/course-enrollment.repository.ts
import { CourseEnrollment } from '../entities/course-enrollment/course-enrollment.entity'
import {
    CreateCourseEnrollmentData,
    UpdateCourseEnrollmentData,
    CourseEnrollmentFilterOptions,
    CourseEnrollmentPaginationOptions,
    CourseEnrollmentListResult,
} from '../interface/course-enrollment/course-enrollment.interface'

export interface ICourseEnrollmentRepository {
    // Basic CRUD
    create(data: CreateCourseEnrollmentData): Promise<CourseEnrollment>
    createBulk(data: CreateCourseEnrollmentData[]): Promise<CourseEnrollment[]>
    findById(id: number): Promise<CourseEnrollment | null>
    update(id: number, data: UpdateCourseEnrollmentData): Promise<CourseEnrollment>
    delete(id: number): Promise<boolean>
    findAll(): Promise<CourseEnrollment[]>

    // Pagination methods (CHUẨN GIỐNG CourseRepo)
    findAllWithPagination(
        pagination: CourseEnrollmentPaginationOptions,
        filters?: CourseEnrollmentFilterOptions,
    ): Promise<CourseEnrollmentListResult>

    // Query methods
    findByCourse(courseId: number): Promise<CourseEnrollment[]>
    findByStudent(studentId: number): Promise<CourseEnrollment[]>
    findByCourseAndStudent(courseId: number, studentId: number): Promise<CourseEnrollment | null>
    exists(courseId: number, studentId: number): Promise<boolean>

    // Count methods
    count(filters?: CourseEnrollmentFilterOptions): Promise<number>
    countByCourse(courseId: number): Promise<number>
    countByStudent(studentId: number): Promise<number>
}
