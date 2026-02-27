// src/domain/repositories/homework-submit.repository.ts
import { HomeworkSubmit } from '../entities'
import {
    CreateHomeworkSubmitData,
    UpdateHomeworkSubmitData,
    GradeHomeworkSubmitData,
    HomeworkSubmitFilterOptions,
    HomeworkSubmitPaginationOptions,
    HomeworkSubmitListResult,
} from '../interface/homeworkSubmit/homework-submit.interface'

export interface IHomeworkSubmitRepository {
    create(data: CreateHomeworkSubmitData): Promise<HomeworkSubmit>
    findById(id: number): Promise<HomeworkSubmit | null>
    update(id: number, data: UpdateHomeworkSubmitData): Promise<HomeworkSubmit>
    delete(id: number): Promise<boolean>
    findAll(): Promise<HomeworkSubmit[]>

    // Pagination methods
    findAllWithPagination(
        pagination: HomeworkSubmitPaginationOptions,
        filters?: HomeworkSubmitFilterOptions,
    ): Promise<HomeworkSubmitListResult>

    // Search methods
    searchHomeworkSubmits(searchTerm: string, pagination?: HomeworkSubmitPaginationOptions): Promise<HomeworkSubmitListResult>

    // Filter methods
    findByFilters(filters: HomeworkSubmitFilterOptions, pagination?: HomeworkSubmitPaginationOptions): Promise<HomeworkSubmitListResult>
    findByHomeworkContent(homeworkContentId: number): Promise<HomeworkSubmit[]>
    findByStudent(studentId: number): Promise<HomeworkSubmit[]>
    findByGrader(graderId: number): Promise<HomeworkSubmit[]>
    findByHomeworkAndStudent(homeworkContentId: number, studentId: number): Promise<HomeworkSubmit | null>
    findManyByContentAndStudents(homeworkContentId: number, studentIds: number[]): Promise<HomeworkSubmit[]>

    // Grade method
    grade(id: number, data: GradeHomeworkSubmitData): Promise<HomeworkSubmit>

    // Count methods
    count(filters?: HomeworkSubmitFilterOptions): Promise<number>
    countByHomeworkContent(homeworkContentId: number): Promise<number>
    countByStudent(studentId: number): Promise<number>
    countGradedSubmits(homeworkContentId?: number): Promise<number>
    countUngradedSubmits(homeworkContentId?: number): Promise<number>
}
