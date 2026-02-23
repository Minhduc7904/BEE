// src/domain/repositories/competition-answer.repository.ts
import { CompetitionAnswer } from '../entities/exam/competition-answer.entity'

export interface CreateCompetitionAnswerData {
    competitionSubmitId: number
    questionId: number
    answer?: string | null
    selectedStatementIds?: number[]
    isCorrect?: boolean | null
    points?: number | null
    maxPoints?: number | null
    timeSpentSeconds?: number | null
}

export interface UpdateCompetitionAnswerData {
    answer?: string | null
    selectedStatementIds?: number[]
    isCorrect?: boolean | null
    points?: number | null
    maxPoints?: number | null
    timeSpentSeconds?: number | null
}

export interface GradeCompetitionAnswerData {
    isCorrect: boolean
    points: number
    maxPoints: number
}

export interface CompetitionAnswerFilterOptions {
    competitionSubmitId?: number
    questionId?: number
    isCorrect?: boolean | null
    hasAnswer?: boolean
}

export interface CompetitionAnswerPaginationOptions {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface CompetitionAnswerListResult {
    competitionAnswers: CompetitionAnswer[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface ICompetitionAnswerRepository {
    create(data: CreateCompetitionAnswerData, txClient?: any): Promise<CompetitionAnswer>
    createMany(data: CreateCompetitionAnswerData[], txClient?: any): Promise<CompetitionAnswer[]>
    findById(id: number, txClient?: any): Promise<CompetitionAnswer | null>
    update(id: number, data: UpdateCompetitionAnswerData, txClient?: any): Promise<CompetitionAnswer>
    updateMany(updates: { id: number; data: UpdateCompetitionAnswerData }[], txClient?: any): Promise<CompetitionAnswer[]>
    delete(id: number, txClient?: any): Promise<void>
    deleteMany(ids: number[], txClient?: any): Promise<void>
    findAll(txClient?: any): Promise<CompetitionAnswer[]>

    // Pagination methods
    findAllWithPagination(
        pagination: CompetitionAnswerPaginationOptions,
        filters?: CompetitionAnswerFilterOptions,
        txClient?: any,
    ): Promise<CompetitionAnswerListResult>

    // Filter methods
    findByFilters(
        filters: CompetitionAnswerFilterOptions,
        pagination?: CompetitionAnswerPaginationOptions,
        txClient?: any,
    ): Promise<CompetitionAnswerListResult>

    findByCompetitionSubmit(competitionSubmitId: number, txClient?: any): Promise<CompetitionAnswer[]>
    findByQuestion(questionId: number, txClient?: any): Promise<CompetitionAnswer[]>
    findBySubmitAndQuestion(
        competitionSubmitId: number,
        questionId: number,
        txClient?: any,
    ): Promise<CompetitionAnswer | null>

    // Grade method
    grade(id: number, data: GradeCompetitionAnswerData, txClient?: any): Promise<CompetitionAnswer>
    gradeMany(grades: { id: number; data: GradeCompetitionAnswerData }[], txClient?: any): Promise<CompetitionAnswer[]>

    // Count methods
    count(filters?: CompetitionAnswerFilterOptions, txClient?: any): Promise<number>
    countByCompetitionSubmit(competitionSubmitId: number, txClient?: any): Promise<number>
    countByQuestion(questionId: number, txClient?: any): Promise<number>
    countCorrectAnswers(competitionSubmitId: number, txClient?: any): Promise<number>
    countIncorrectAnswers(competitionSubmitId: number, txClient?: any): Promise<number>
    countGradedAnswers(competitionSubmitId: number, txClient?: any): Promise<number>
    countUngradedAnswers(competitionSubmitId: number, txClient?: any): Promise<number>

    // Statistics
    calculateTotalPoints(competitionSubmitId: number, txClient?: any): Promise<{ totalPoints: number; maxPoints: number }>
}
