import { Competition } from '../../../domain/entities/exam/competition.entity'
import { BaseResponseDto } from '../common/base-response.dto'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'

export enum PublicCompetitionTimelineStatus {
    ONGOING = 'ONGOING',
    UPCOMING = 'UPCOMING',
    ENDED = 'ENDED',
}

export enum PublicCompetitionAttemptStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    ATTEMPTED = 'ATTEMPTED',
    NOT_ATTEMPTED = 'NOT_ATTEMPTED',
}

export class PublicStudentCompetitionResponseDto {
    competitionId: number
    title: string
    subtitle?: string | null
    policies?: string | null
    examId?: number | null
    exam?: {
        examId: number
        title: string
        grade?: number
        visibility: string
    } | null

    startDate?: Date | null
    endDate?: Date | null
    durationMinutes?: number | null

    timelineStatus: PublicCompetitionTimelineStatus
    attemptStatus: PublicCompetitionAttemptStatus
    canAttempt: boolean
    attemptedCount: number
    maxAttempts?: number | null

    allowLeaderboard: boolean

    static fromEntity(
        entity: Competition,
        attemptedCount: number,
        hasInProgress = false,
        now: Date = new Date(),
    ): PublicStudentCompetitionResponseDto {
        const dto = new PublicStudentCompetitionResponseDto()

        dto.competitionId = entity.competitionId
        dto.title = entity.title
        dto.subtitle = entity.subtitle
        dto.policies = entity.policies
        dto.examId = entity.examId

        if (entity.exam) {
            dto.exam = {
                examId: entity.exam.examId,
                title: entity.exam.title,
                grade: entity.exam.grade,
                visibility: entity.exam.visibility,
            }
        }

        dto.startDate = entity.startDate
        dto.endDate = entity.endDate
        dto.durationMinutes = entity.durationMinutes
        dto.maxAttempts = entity.maxAttempts
        dto.attemptedCount = attemptedCount

        dto.allowLeaderboard = entity.allowLeaderboard

        const hasStarted = !entity.startDate || entity.startDate <= now
        const isNotEnded = !entity.endDate || entity.endDate >= now

        if (!hasStarted) {
            dto.timelineStatus = PublicCompetitionTimelineStatus.UPCOMING
        } else if (!isNotEnded) {
            dto.timelineStatus = PublicCompetitionTimelineStatus.ENDED
        } else {
            dto.timelineStatus = PublicCompetitionTimelineStatus.ONGOING
        }

        if (hasInProgress) {
            dto.attemptStatus = PublicCompetitionAttemptStatus.IN_PROGRESS
        } else {
            dto.attemptStatus =
                attemptedCount > 0
                    ? PublicCompetitionAttemptStatus.ATTEMPTED
                    : PublicCompetitionAttemptStatus.NOT_ATTEMPTED
        }

        const hasUnlimitedAttempts = entity.maxAttempts === null || entity.maxAttempts === undefined
        dto.canAttempt =
            dto.timelineStatus === PublicCompetitionTimelineStatus.ONGOING
            && (hasUnlimitedAttempts || attemptedCount < (entity.maxAttempts as number))

        return dto
    }

    static fromEntities(
        entities: Competition[],
        attemptCountByCompetitionId: Map<number, number>,
        inProgressByCompetitionId: Map<number, boolean>,
        now: Date = new Date(),
    ): PublicStudentCompetitionResponseDto[] {
        return entities.map((entity) => {
            const attemptedCount = attemptCountByCompetitionId.get(entity.competitionId) ?? 0
            const hasInProgress = inProgressByCompetitionId.get(entity.competitionId) ?? false
            return PublicStudentCompetitionResponseDto.fromEntity(entity, attemptedCount, hasInProgress, now)
        })
    }
}

export class PublicStudentCompetitionListResponseDto extends PaginationResponseDto<PublicStudentCompetitionResponseDto> {
    static fromResult(
        items: PublicStudentCompetitionResponseDto[],
        page: number,
        limit: number,
        total: number,
    ): PublicStudentCompetitionListResponseDto {
        return PaginationResponseDto.success(
            'Fetched public competitions for student successfully',
            items,
            page,
            limit,
            total,
        ) as PublicStudentCompetitionListResponseDto
    }
}

export class PublicStudentCompetitionDetailResponseDto extends PublicStudentCompetitionResponseDto {
    showResultDetail: boolean
    allowViewScore: boolean
    bestSubmittedScore?: number | null
    allowViewAnswer: boolean
    allowViewSolutionYoutubeUrl: boolean
    allowViewExamContent: boolean

    static fromEntity(
        entity: Competition,
        attemptedCount: number,
        hasInProgress = false,
        now: Date = new Date(),
        bestSubmittedScore: number | null = null,
    ): PublicStudentCompetitionDetailResponseDto {
        const base = PublicStudentCompetitionResponseDto.fromEntity(entity, attemptedCount, hasInProgress, now)
        const dto = new PublicStudentCompetitionDetailResponseDto()

        Object.assign(dto, base)

        // Hide all result/view flags while competition is still active or has no end date.
        const isHiddenByTimeline = !entity.endDate || entity.endDate >= now

        dto.showResultDetail = isHiddenByTimeline ? false : entity.showResultDetail
        dto.allowLeaderboard = entity.allowLeaderboard
        dto.allowViewScore = entity.allowViewScore
        dto.bestSubmittedScore = bestSubmittedScore
        dto.allowViewAnswer = isHiddenByTimeline ? false : entity.allowViewAnswer
        dto.allowViewSolutionYoutubeUrl = isHiddenByTimeline ? false : entity.allowViewSolutionYoutubeUrl
        dto.allowViewExamContent = entity.allowViewExamContent

        return dto
    }
}

export class PublicStudentCompetitionDetailApiResponseDto extends BaseResponseDto<PublicStudentCompetitionDetailResponseDto> { }
