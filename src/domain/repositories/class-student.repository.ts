// src/domain/repositories/class-student.repository.ts
import { ClassStudent } from '../entities/class-student/class-student.entity'
import {
    CreateClassStudentData,
    ClassStudentFilterOptions,
    ClassStudentPaginationOptions,
    ClassStudentListResult,
} from '../interface/class-student/class-student.interface'

export interface IClassStudentRepository {
    // Basic CRUD
    create(data: CreateClassStudentData): Promise<ClassStudent>
    createBulk(data: CreateClassStudentData[]): Promise<ClassStudent[]>
    findByIds(classId: number, studentId: number): Promise<ClassStudent | null>
    delete(classId: number, studentId: number): Promise<boolean>
    findAll(): Promise<ClassStudent[]>

    // Pagination methods (CHUẨN GIỐNG CourseRepo)
    findAllWithPagination(
        pagination: ClassStudentPaginationOptions,
        filters?: ClassStudentFilterOptions,
    ): Promise<ClassStudentListResult>

    // Query methods (DOMAIN-LEVEL)
    findByClass(classId: number, isActive?: boolean): Promise<ClassStudent[]>
    findByStudent(studentId: number): Promise<ClassStudent[]>
    exists(classId: number, studentId: number): Promise<boolean>

    // Count methods
    count(filters?: ClassStudentFilterOptions): Promise<number>
    countByClass(classId: number): Promise<number>
    countByStudent(studentId: number): Promise<number>
}
