import { Difficulty } from '../../shared/enums'
import { QuestionAnswer } from '../entities/exam/question-answer.entity'
export interface StudentDifficultyProgressStat {
    difficulty: Difficulty
    doneCount: number
    totalCount: number
}

export interface StudentQuestionAnswerStatisticsFilterOptions {
    fromDate?: string
    toDate?: string
}

export interface StudentQuestionAnswerChapterStat {
    chapterId: number | null
    chapterName: string
    totalQuestionsInChapter: number
    answeredCount: number
    correctCount: number
    incorrectCount: number
}

export interface StudentQuestionAnswerDifficultyStat {
    difficulty: Difficulty | null
    answeredCount: number
    correctCount: number
    incorrectCount: number
}

export interface StudentQuestionAnswerDailyStat {
    date: string
    answeredCount: number
}

export interface StudentQuestionAnswerStatisticsResult {
    byChapter: StudentQuestionAnswerChapterStat[]
    byDifficulty: StudentQuestionAnswerDifficultyStat[]
    byDay: StudentQuestionAnswerDailyStat[]
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

    getPublicStudentStatistics(
        studentId: number,
        filters?: StudentQuestionAnswerStatisticsFilterOptions,
        txClient?: any,
    ): Promise<StudentQuestionAnswerStatisticsResult>

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

    findPublicByStudentAndQuestionIds(
        studentId: number,
        questionIds: number[],
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
