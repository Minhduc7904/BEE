import { ExamAttemptStatus } from '../../shared/enums/exam-attempt-status.enum'
import { ExamAttempt } from '../entities/exam/exam-attempt.entity'

export interface DailyActivityCount {
    date: string
    count: number
}

export interface ExamAttemptPaginationOptions {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface StudentExamAttemptFilterOptions {
    examId?: number
    status?: ExamAttemptStatus
}

export interface ExamAttemptListResult {
    examAttempts: ExamAttempt[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface IExamAttemptRepository {
    countByStudentDailyInYear(
        studentId: number,
        year: number,
        txClient?: any,
    ): Promise<DailyActivityCount[]>

    getStudentActivityDatesVn(
        studentId: number,
        txClient?: any,
    ): Promise<string[]>

    findPublicByStudentWithPagination(
        studentId: number,
        pagination: ExamAttemptPaginationOptions,
        filters?: StudentExamAttemptFilterOptions,
        txClient?: any,
    ): Promise<ExamAttemptListResult>
}
