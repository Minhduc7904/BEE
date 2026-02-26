// src/domain/repositories/competition-submit.repository.ts
import { CompetitionSubmit } from '../entities/exam/competition-submit.entity'
import { CompetitionSubmitStatus } from '../../shared/enums/competition-submit-status.enum'

export interface CreateCompetitionSubmitData {
    competitionId: number
    studentId: number
    attemptNumber: number
    status: CompetitionSubmitStatus
    startedAt: Date
    submittedAt?: Date | null
    gradedAt?: Date | null
    totalPoints?: number | null
    maxPoints?: number | null
    timeSpentSeconds?: number | null
    metadata?: any
}

export interface UpdateCompetitionSubmitData {
    status?: CompetitionSubmitStatus
    submittedAt?: Date | null
    gradedAt?: Date | null
    totalPoints?: number | null
    maxPoints?: number | null
    timeSpentSeconds?: number | null
    metadata?: any
}

export interface GradeCompetitionSubmitData {
    totalPoints: number
    maxPoints: number
    gradedAt: Date
    metadata?: any
}

export interface CompetitionSubmitFilterOptions {
    competitionId?: number
    studentId?: number
    status?: CompetitionSubmitStatus
    attemptNumber?: number
    startedFrom?: Date
    startedTo?: Date
    submittedFrom?: Date
    submittedTo?: Date
    isGraded?: boolean
}

export interface CompetitionSubmitPaginationOptions {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface CompetitionSubmitListResult {
    competitionSubmits: CompetitionSubmit[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface ICompetitionSubmitRepository {
    create(data: CreateCompetitionSubmitData, txClient?: any): Promise<CompetitionSubmit>
    findById(id: number, txClient?: any): Promise<CompetitionSubmit | null>
    update(id: number, data: UpdateCompetitionSubmitData, txClient?: any): Promise<CompetitionSubmit>
    delete(id: number, txClient?: any): Promise<void>
    findAll(txClient?: any): Promise<CompetitionSubmit[]>

    // Pagination methods
    findAllWithPagination(
        pagination: CompetitionSubmitPaginationOptions,
        filters?: CompetitionSubmitFilterOptions,
        txClient?: any,
    ): Promise<CompetitionSubmitListResult>

    // Filter methods
    findByFilters(
        filters: CompetitionSubmitFilterOptions,
        pagination?: CompetitionSubmitPaginationOptions,
        txClient?: any,
    ): Promise<CompetitionSubmitListResult>

    findByCompetition(competitionId: number, txClient?: any): Promise<CompetitionSubmit[]>
    findByStudent(studentId: number, txClient?: any): Promise<CompetitionSubmit[]>
    findByCompetitionAndStudent(
        competitionId: number,
        studentId: number,
        txClient?: any,
    ): Promise<CompetitionSubmit[]>

    findLatestAttempt(
        competitionId: number,
        studentId: number,
        txClient?: any,
    ): Promise<CompetitionSubmit | null>

    findByAttempt(
        competitionId: number,
        studentId: number,
        attemptNumber: number,
        txClient?: any,
    ): Promise<CompetitionSubmit | null>

    // Grade method
    grade(id: number, data: GradeCompetitionSubmitData, txClient?: any): Promise<CompetitionSubmit>

    // Count methods
    count(filters?: CompetitionSubmitFilterOptions, txClient?: any): Promise<number>
    countByCompetition(competitionId: number, txClient?: any): Promise<number>
    countByStudent(studentId: number, txClient?: any): Promise<number>
    countByStatus(status: CompetitionSubmitStatus, competitionId?: number, txClient?: any): Promise<number>
    countGradedSubmits(competitionId?: number, txClient?: any): Promise<number>
    countUngradedSubmits(competitionId?: number, txClient?: any): Promise<number>

    // Leaderboard
    getLeaderboard(
        competitionId: number,
        limit?: number,
        txClient?: any,
    ): Promise<CompetitionSubmit[]>
    
    getPaginatedLeaderboard(
        competitionId: number,
        page: number,
        limit: number,
        txClient?: any,
    ): Promise<{ submits: CompetitionSubmit[], total: number }>
}
