// src/application/dtos/competition/competition.dto.ts
import { Competition } from '../../../domain/entities/exam/competition.entity'
import { Exam } from '../../../domain/entities/exam/exam.entity'
import { Visibility } from '../../../shared/enums'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { UserResponseDto } from '../user/user.dto'

export class CompetitionResponseDto {
    // Identity
    competitionId: number
    title: string
    subtitle?: string | null

    // References
    examId?: number | null
    createdBy: number

    // Exam Info (if populated)
    exam?: {
        examId: number
        title: string
        grade?: number
        visibility: string
    } | null

    // Creator Information
    createdByAdmin?: {
        adminId: number
        userId: number
        firstName: string
        lastName: string
        fullName: string
        email?: string
    } | null

    // Settings
    policies?: string | null
    startDate: Date
    endDate: Date
    durationMinutes?: number | null
    maxAttempts?: number | null
    visibility: Visibility

    // Permissions
    showResultDetail: boolean
    allowLeaderboard: boolean
    allowViewScore: boolean
    allowViewAnswer: boolean
    enableAntiCheating: boolean

    // Metadata
    createdAt: Date
    updatedAt: Date

    // Computed
    hasSubtitle: boolean
    hasPolicies: boolean
    hasExam: boolean
    isPublished: boolean
    isDraft: boolean
    isOngoing: boolean
    isUpcoming: boolean
    isEnded: boolean

    // Processed content with presigned URLs
    processedPolicies?: string | null

    static fromEntity(entity: Competition): CompetitionResponseDto {
        const dto = new CompetitionResponseDto()
        const now = new Date()

        // Identity
        dto.competitionId = entity.competitionId
        dto.title = entity.title
        dto.subtitle = entity.subtitle

        // References
        dto.examId = entity.examId
        dto.createdBy = entity.createdBy

        // Exam Info
        if (entity.exam) {
            dto.exam = {
                examId: entity.exam.examId,
                title: entity.exam.title,
                grade: entity.exam.grade,
                visibility: entity.exam.visibility,
            }
        }

        // Creator Information
        if (entity.admin) {
            const admin = entity.admin
            dto.createdByAdmin = {
                adminId: admin.adminId,
                userId: admin.user?.userId || 0,
                firstName: admin.user?.firstName || '',
                lastName: admin.user?.lastName || '',
                fullName: admin.user ? `${admin.user.firstName} ${admin.user.lastName}`.trim() : '',
                email: admin.user?.email,
            }
        }

        // Settings
        dto.policies = entity.policies
        dto.startDate = entity.startDate
        dto.endDate = entity.endDate
        dto.durationMinutes = entity.durationMinutes
        dto.maxAttempts = entity.maxAttempts
        dto.visibility = entity.visibility

        // Permissions
        dto.showResultDetail = entity.showResultDetail
        dto.allowLeaderboard = entity.allowLeaderboard
        dto.allowViewScore = entity.allowViewScore
        dto.allowViewAnswer = entity.allowViewAnswer
        dto.enableAntiCheating = entity.enableAntiCheating

        // Metadata
        dto.createdAt = entity.createdAt
        dto.updatedAt = entity.updatedAt

        // Computed
        dto.hasSubtitle = Boolean(entity.subtitle && entity.subtitle.trim().length > 0)
        dto.hasPolicies = Boolean(entity.policies && entity.policies.trim().length > 0)
        dto.hasExam = entity.examId !== null && entity.examId !== undefined
        dto.isPublished = entity.visibility === Visibility.PUBLISHED
        dto.isDraft = entity.visibility === Visibility.DRAFT
        dto.isOngoing = now >= entity.startDate && now <= entity.endDate
        dto.isUpcoming = now < entity.startDate
        dto.isEnded = now > entity.endDate

        return dto
    }

    static fromEntities(entities: Competition[]): CompetitionResponseDto[] {
        return entities.map((entity) => CompetitionResponseDto.fromEntity(entity))
    }
}

export class CompetitionListResponseDto extends PaginationResponseDto<CompetitionResponseDto> {
  static fromResult(items: CompetitionResponseDto[], page: number, limit: number, total: number): CompetitionListResponseDto {
    return PaginationResponseDto.success('Lấy danh sách cuộc thi thành công', items, page, limit, total) as CompetitionListResponseDto
  }
}
