// src/application/dtos/competition-submit/student-competition-history.dto.ts
import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import { CompetitionSubmitStatus } from '../../../shared/enums'
import { BaseResponseDto } from '../common/base-response.dto'

/**
 * DTO trả về 1 lần thi đã hoàn thành (SUBMITTED / GRADED) trong lịch sử của học sinh.
 * Chỉ bao gồm thông tin điểm số và thời gian – không kèm chi tiết student/competition vì
 * đây là lịch sử của chính học sinh đang đăng nhập.
 */
export class StudentCompetitionHistoryItemDto {
    competitionSubmitId: number
    attemptNumber: number
    status: CompetitionSubmitStatus

    startedAt?: Date
    submittedAt?: Date
    timeSpentSeconds?: number
    timeSpentDisplay?: string

    totalPoints?: number
    maxPoints?: number
    scorePercentage?: number

    isGraded: boolean
    hasScore: boolean

    createdAt: Date
    updatedAt: Date

    static fromEntity(entity: CompetitionSubmit): StudentCompetitionHistoryItemDto {
        const dto = new StudentCompetitionHistoryItemDto()

        dto.competitionSubmitId = entity.competitionSubmitId
        dto.attemptNumber = entity.attemptNumber
        dto.status = entity.status

        dto.startedAt = entity.startedAt ?? undefined
        dto.submittedAt = entity.submittedAt ?? undefined
        dto.timeSpentSeconds = entity.timeSpentSeconds ?? undefined
        dto.timeSpentDisplay = entity.getTimeSpentDisplay() ?? undefined

        dto.totalPoints = entity.totalPoints ?? undefined
        dto.maxPoints = entity.maxPoints ?? undefined
        dto.scorePercentage = entity.getScorePercentage() ?? undefined

        dto.isGraded = entity.isGraded()
        dto.hasScore = entity.hasScore()

        dto.createdAt = entity.createdAt
        dto.updatedAt = entity.updatedAt

        return dto
    }
}

export class StudentCompetitionHistoryListResponseDto extends BaseResponseDto<{
    history: StudentCompetitionHistoryItemDto[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> {}
