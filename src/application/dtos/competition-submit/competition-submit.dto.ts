// src/application/dtos/competition-submit/competition-submit.dto.ts
import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import { CompetitionSubmitStatus } from '../../../shared/enums'
import { BaseResponseDto } from '../common/base-response.dto'
import { StudentResponseDto } from '../student/student.dto'
import { CompetitionResponseDto } from '../competition/competition.dto'
import { CompetitionAnswerResponseDto } from './competition-answer.dto'

export class CompetitionSubmitResponseDto {
    // Identity
    competitionSubmitId: number
    competitionId: number
    studentId: number
    attemptNumber: number

    // Status
    status: CompetitionSubmitStatus

    // Timing
    startedAt?: Date
    submittedAt?: Date
    timeSpentSeconds?: number

    // Scoring
    totalPoints?: number
    maxPoints?: number

    // Metadata
    createdAt: Date
    updatedAt: Date

    // Relations
    competition?: CompetitionResponseDto
    student?: StudentResponseDto
    competitionAnswers?: CompetitionAnswerResponseDto[]

    // Computed properties
    isInProgress: boolean
    isSubmitted: boolean
    isAbandoned: boolean
    isGraded: boolean
    hasScore: boolean
    scorePercentage?: number
    timeSpentDisplay?: string
    
    static fromEntity(entity: CompetitionSubmit): CompetitionSubmitResponseDto {
        const dto = new CompetitionSubmitResponseDto()
        
        // Identity
        dto.competitionSubmitId = entity.competitionSubmitId
        dto.competitionId = entity.competitionId
        dto.studentId = entity.studentId
        dto.attemptNumber = entity.attemptNumber

        // Status
        dto.status = entity.status

        // Timing
        dto.startedAt = entity.startedAt ?? undefined
        dto.submittedAt = entity.submittedAt ?? undefined
        dto.timeSpentSeconds = entity.timeSpentSeconds ?? undefined

        // Scoring
        dto.totalPoints = entity.totalPoints ?? undefined
        dto.maxPoints = entity.maxPoints ?? undefined

        // Metadata
        dto.createdAt = entity.createdAt
        dto.updatedAt = entity.updatedAt

        // Computed properties
        dto.isInProgress = entity.isInProgress()
        dto.isSubmitted = entity.isSubmitted()
        dto.isAbandoned = entity.isAbandoned()
        dto.isGraded = entity.isGraded()
        dto.hasScore = entity.hasScore()
        dto.scorePercentage = entity.getScorePercentage() ?? undefined
        dto.timeSpentDisplay = entity.getTimeSpentDisplay() ?? undefined

        // Relations
        if (entity.competition) {
            dto.competition = CompetitionResponseDto.fromEntity(entity.competition)
        }

        if (entity.student?.user) {
            dto.student = StudentResponseDto.fromUserWithStudent(entity.student.user, entity.student)
        }

        if (entity.competitionAnswers && entity.competitionAnswers.length > 0) {
            dto.competitionAnswers = entity.competitionAnswers.map(answer => 
                CompetitionAnswerResponseDto.fromEntity(answer)
            )
        }

        return dto
    }
}

export class CompetitionSubmitListResponseDto extends BaseResponseDto<{
    competitionSubmits: CompetitionSubmitResponseDto[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> { }
