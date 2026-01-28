// src/domain/repositories/course.repository.ts
import { Course } from '../entities'
import {
    CreateCourseData,
    UpdateCourseData,
    CourseFilterOptions,
    CoursePaginationOptions,
    CourseListResult,
    StudentAttendanceFilterOptions,
    StudentAttendancePaginationOptions,
    StudentAttendanceResult,
} from '../interface/course/course.interface'
import { CourseVisibility } from 'src/shared/enums'

export interface ICourseRepository {
    create(data: CreateCourseData): Promise<Course>
    findById(id: number): Promise<Course | null>
    update(id: number, data: UpdateCourseData): Promise<Course>
    delete(id: number): Promise<boolean>
    findAll(): Promise<Course[]>

    // Pagination methods
    findAllWithPagination(
        pagination: CoursePaginationOptions,
        filters?: CourseFilterOptions,
    ): Promise<CourseListResult>

    // Search methods
    searchCourses(searchTerm: string, pagination?: CoursePaginationOptions): Promise<CourseListResult>

    // Filter methods
    findByFilters(filters: CourseFilterOptions, pagination?: CoursePaginationOptions): Promise<CourseListResult>
    findByGrade(grade: number): Promise<Course[]>
    findBySubject(subjectId: number): Promise<Course[]>
    findByTeacher(teacherId: number): Promise<Course[]>
    findByVisibility(visibility: CourseVisibility): Promise<Course[]>

    // Count methods
    count(filters?: CourseFilterOptions): Promise<number>
    countByGrade(grade: number): Promise<number>
    countBySubject(subjectId: number): Promise<number>
    countByTeacher(teacherId: number): Promise<number>

    // Students attendance methods
    findStudentsWithAttendance(
        courseId: number,
        filters: StudentAttendanceFilterOptions,
        pagination: StudentAttendancePaginationOptions,
    ): Promise<StudentAttendanceResult>
}
