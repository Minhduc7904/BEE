import { Difficulty } from '../../shared/enums'
import { QuestionAnswer } from '../entities/exam/question-answer.entity'
export interface StudentDifficultyProgressStat {
    difficulty: Difficulty
    doneCount: number
    totalCount: number
}

export interface QuestionAnswerPaginationOptions {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface StudentQuestionAnswerFilterOptions {
    examId?: number
    attemptId?: number
    questionId?: number
}

export interface CreateQuestionAnswerData {
    attemptId?: number | null
    questionId: number
    answer?: string | null
    selectedStatementIds?: number[] | null
    isCorrect?: boolean | null
    points?: number | null
    maxPoints?: number | null
    timeSpentSeconds?: number | null
}

export interface UpdateQuestionAnswerData {
    answer?: string | null
    selectedStatementIds?: number[] | null
    isCorrect?: boolean | null
    points?: number | null
    maxPoints?: number | null
    timeSpentSeconds?: number | null
}

export interface AttemptAnswerTotals {
    totalPoints: number
    maxPoints: number
}

export interface QuestionAnswerListResult {
    questionAnswers: QuestionAnswer[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface IQuestionAnswerRepository {
    getStudentDifficultyProgress(
        studentId: number,
        grade?: number,
        txClient?: any,
    ): Promise<StudentDifficultyProgressStat[]>

    findPublicByStudentWithPagination(
        studentId: number,
        pagination: QuestionAnswerPaginationOptions,
        filters?: StudentQuestionAnswerFilterOptions,
        txClient?: any,
    ): Promise<QuestionAnswerListResult>

    findPublicByStudentAndAttempt(
        studentId: number,
        attemptId: number,
        txClient?: any,
    ): Promise<QuestionAnswer[]>

    findByAttemptAndQuestion(
        attemptId: number | null,
        questionId: number,
        txClient?: any,
    ): Promise<QuestionAnswer | null>

    create(
        data: CreateQuestionAnswerData,
        txClient?: any,
    ): Promise<QuestionAnswer>

    update(
        questionAnswerId: number,
        data: UpdateQuestionAnswerData,
        txClient?: any,
    ): Promise<QuestionAnswer>

    calculateAttemptTotals(
        attemptId: number,
        txClient?: any,
    ): Promise<AttemptAnswerTotals>
}
