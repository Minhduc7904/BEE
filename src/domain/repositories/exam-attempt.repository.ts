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

export interface CreateExamAttemptData {
    examId: number
    studentId: number
    status: ExamAttemptStatus
    startedAt: Date
    duration?: number
    questionIds?: number[]
}

export interface UpdateExamAttemptScoringData {
    score?: number | null
    points?: number | null
    maxPoints?: number | null
    gradedAt?: Date | null
    feedback?: string | null
}

export interface SubmitExamAttemptData {
    status: ExamAttemptStatus
    endAt: Date
    score?: number | null
    points?: number | null
    maxPoints?: number | null
    gradedAt?: Date | null
    feedback?: string | null
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

    findPublicByAttemptAndStudent(
        attemptId: number,
        studentId: number,
        txClient?: any,
    ): Promise<ExamAttempt | null>

    hasSubmittedExamByStudent(
        studentId: number,
        examId: number,
        txClient?: any,
    ): Promise<boolean>

    findSubmittedExamIdsByStudent(
        studentId: number,
        examIds: number[],
        txClient?: any,
    ): Promise<number[]>

    findQuestionIdsByExamId(
        examId: number,
        txClient?: any,
    ): Promise<number[]>

    create(
        data: CreateExamAttemptData,
        txClient?: any,
    ): Promise<ExamAttempt>

    updateScoring(
        attemptId: number,
        data: UpdateExamAttemptScoringData,
        txClient?: any,
    ): Promise<ExamAttempt>

    submitAttempt(
        attemptId: number,
        data: SubmitExamAttemptData,
        txClient?: any,
    ): Promise<ExamAttempt>
}
