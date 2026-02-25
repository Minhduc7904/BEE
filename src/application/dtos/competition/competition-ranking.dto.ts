// src/application/dtos/competition/competition-ranking.dto.ts
import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import { BaseResponseDto } from '../common/base-response.dto'

/**
 * DTO cho thông tin student trong ranking
 */
export class RankingStudentDto {
    studentId: number
    userId: number
    firstName: string
    lastName: string
    fullName: string
    grade?: number
    school?: string

    static fromEntity(submit: CompetitionSubmit): RankingStudentDto {
        const dto = new RankingStudentDto()
        const student = submit.student
        
        if (!student) {
            throw new Error('Student information is required for ranking')
        }

        dto.studentId = student.studentId
        dto.userId = student.user?.userId || 0
        dto.firstName = student.user?.firstName || ''
        dto.lastName = student.user?.lastName || ''
        dto.fullName = `${student.user?.lastName || ''} ${student.user?.firstName || ''}`.trim()
        dto.grade = student.grade
        dto.school = student.school ?? undefined

        return dto
    }
}

/**
 * DTO cho một entry trong ranking của chính student
 */
export class StudentOwnRankingEntryDto {
    rank: number
    competitionSubmitId: number
    totalPoints: number
    maxPoints?: number
    percentageScore?: number
    attemptNumber: number
    submittedAt?: Date
    timeSpentSeconds?: number
    status: string

    static fromEntity(submit: CompetitionSubmit, rank: number): StudentOwnRankingEntryDto {
        const dto = new StudentOwnRankingEntryDto()
        
        dto.rank = rank
        dto.competitionSubmitId = submit.competitionSubmitId
        dto.totalPoints = submit.totalPoints ? Number(submit.totalPoints) : 0
        dto.maxPoints = submit.maxPoints ? Number(submit.maxPoints) : undefined
        dto.attemptNumber = submit.attemptNumber
        dto.submittedAt = submit.submittedAt ?? undefined
        dto.timeSpentSeconds = submit.timeSpentSeconds ?? undefined
        dto.status = submit.status

        // Calculate percentage if maxPoints is available
        if (dto.maxPoints && dto.maxPoints > 0) {
            dto.percentageScore = Math.round((dto.totalPoints / dto.maxPoints) * 10000) / 100 // Round to 2 decimal places
        }

        return dto
    }
}

/**
 * DTO cho một entry trong ranking
 */
export class CompetitionRankingEntryDto {
    rank: number
    competitionSubmitId: number
    student: RankingStudentDto
    totalPoints: number
    maxPoints?: number
    percentageScore?: number
    attemptNumber: number
    submittedAt?: Date
    timeSpentSeconds?: number

    static fromEntity(submit: CompetitionSubmit, rank: number): CompetitionRankingEntryDto {
        const dto = new CompetitionRankingEntryDto()
        
        dto.rank = rank
        dto.competitionSubmitId = submit.competitionSubmitId
        dto.student = RankingStudentDto.fromEntity(submit)
        dto.totalPoints = submit.totalPoints ? Number(submit.totalPoints) : 0
        dto.maxPoints = submit.maxPoints ? Number(submit.maxPoints) : undefined
        dto.attemptNumber = submit.attemptNumber
        dto.submittedAt = submit.submittedAt ?? undefined
        dto.timeSpentSeconds = submit.timeSpentSeconds ?? undefined

        // Calculate percentage if maxPoints is available
        if (dto.maxPoints && dto.maxPoints > 0) {
            dto.percentageScore = Math.round((dto.totalPoints / dto.maxPoints) * 10000) / 100 // Round to 2 decimal places
        }

        return dto
    }
}

/**
 * Response DTO for student's own ranking in competition
 */
export class StudentOwnRankingResponseDto extends BaseResponseDto<{
    competitionId: number
    competitionTitle: string
    totalAttempts: number
    highestScore: number
    highestRank?: number
    attempts: StudentOwnRankingEntryDto[]
}> { }

/**
 * Query DTO for ranking list
 */
export class CompetitionRankingQueryDto {
    page?: number = 1
    limit?: number = 10
}

/**
 * Response DTO for competition ranking with pagination
 */
export class CompetitionRankingResponseDto extends BaseResponseDto<{
    competitionId: number
    competitionTitle: string
    rankings: CompetitionRankingEntryDto[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> { }
