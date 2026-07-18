// src/domain/repositories/competition.repository.ts
import { Competition } from '../entities/exam/competition.entity'
import { Visibility } from 'src/shared/enums'
import { PublicCompetitionStatus } from 'src/shared/enums/public-competition-status.enum'

export interface CreateCompetitionData {
    title: string
    adminId: number
    visibility: Visibility
    startDate?: Date | null
    endDate?: Date | null
    subtitle?: string | null
    examId?: number | null
    policies?: string | null
    durationMinutes?: number | null
    maxAttempts?: number | null
    showResultDetail?: boolean
    allowLeaderboard?: boolean
    allowViewScore?: boolean
    allowViewAnswer?: boolean
    enableAntiCheating?: boolean
    allowViewSolutionYoutubeUrl?: boolean
    allowViewExamContent?: boolean
}

export interface CompetitionFilterOptions {
    examId?: number
    grade?: number
    visibility?: Visibility
    excludeVisibility?: Visibility
    createdBy?: number
    search?: string
    startDateFrom?: Date
    endDateTo?: Date
    publicStatus?: PublicCompetitionStatus
    attemptedByStudentId?: number
}

export interface CompetitionPaginationOptions {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface CompetitionListResult {
    competitions: Competition[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface CompetitionRelationOptions {
  includeRelations?: boolean
}

export interface ICompetitionRepository {
    create(data: CreateCompetitionData, txClient?: any): Promise<Competition>
    findById(id: number, txClient?: any, options?: CompetitionRelationOptions): Promise<Competition | null>
    update(id: number, data: Partial<CreateCompetitionData>, txClient?: any): Promise<Competition>
    delete(id: number, txClient?: any): Promise<void>
    findAllWithPagination(
        pagination: CompetitionPaginationOptions,
        filters?: CompetitionFilterOptions,
        txClient?: any,
    ): Promise<CompetitionListResult>
}
