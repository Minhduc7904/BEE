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
}
