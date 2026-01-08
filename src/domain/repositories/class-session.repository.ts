// src/domain/repositories/class-session.repository.ts
import { ClassSession } from '../entities/class-session/class-session.entity'
import {
    CreateClassSessionData,
    UpdateClassSessionData,
    ClassSessionFilterOptions,
    ClassSessionPaginationOptions,
    ClassSessionListResult,
} from '../interface/class-session/class-session.interface'

export interface IClassSessionRepository {
    // Basic CRUD
    create(data: CreateClassSessionData): Promise<ClassSession>
    findById(id: number): Promise<ClassSession | null>
    update(id: number, data: UpdateClassSessionData): Promise<ClassSession>
    delete(id: number): Promise<boolean>
    findAll(): Promise<ClassSession[]>

    // Pagination methods (CHUẨN GIỐNG CourseRepo)
    findAllWithPagination(
        pagination: ClassSessionPaginationOptions,
        filters?: ClassSessionFilterOptions,
    ): Promise<ClassSessionListResult>

    // Query methods (DOMAIN-LEVEL)
    findByClass(classId: number): Promise<ClassSession[]>
    // findByDateRange(startDate: Date, endDate: Date): Promise<ClassSession[]>
    findByDate(date: Date): Promise<ClassSession[]>

    // Count methods
    count(filters?: ClassSessionFilterOptions): Promise<number>
    countByClass(classId: number): Promise<number>
}
