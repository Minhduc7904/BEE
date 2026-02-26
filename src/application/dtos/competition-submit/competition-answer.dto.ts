// src/application/dtos/competition-submit/competition-answer.dto.ts
import { CompetitionAnswer } from '../../../domain/entities/exam/competition-answer.entity'
import { BaseResponseDto } from '../common/base-response.dto'

export class CompetitionAnswerResponseDto {
    // Identity
    competitionAnswerId: number
    competitionSubmitId: number
    questionId: number

    // Answer content
    answer?: string
    selectedStatementIds?: number[]

    // Scoring
    isCorrect?: boolean
    points?: number
    maxPoints?: number

    // Metadata
    createdAt: Date
    updatedAt: Date

    // Computed properties
    hasTextAnswer: boolean
    hasSelectedStatements: boolean
    scorePercentage?: number

    static fromEntity(entity: CompetitionAnswer): CompetitionAnswerResponseDto {
        const dto = new CompetitionAnswerResponseDto()
        
        // Identity
        dto.competitionAnswerId = entity.competitionAnswerId
        dto.competitionSubmitId = entity.competitionSubmitId
        dto.questionId = entity.questionId

        // Answer content
        dto.answer = entity.answer ?? undefined
        dto.selectedStatementIds = entity.selectedStatementIds ?? undefined

        // Scoring
        dto.isCorrect = entity.isCorrect ?? undefined
        dto.points = entity.points ?? undefined
        dto.maxPoints = entity.maxPoints ?? undefined

        // Metadata
        dto.createdAt = entity.createdAt
        dto.updatedAt = entity.updatedAt

        // Computed properties
        dto.hasTextAnswer = entity.hasTextAnswer()
        dto.hasSelectedStatements = entity.hasSelectedStatements()
        dto.scorePercentage = entity.getScorePercentage() ?? undefined

        return dto
    }
}

export class CompetitionAnswerListResponseDto extends BaseResponseDto<{
    competitionAnswers: CompetitionAnswerResponseDto[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> { }
