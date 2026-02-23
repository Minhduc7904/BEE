// src/infrastructure/mappers/competition/competition-submit.mapper.ts

import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import { Competition } from '../../../domain/entities/exam/competition.entity'
import { Student } from '../../../domain/entities/user/student.entity'
import { CompetitionMapper } from './competition.mapper'
import { StudentMapper } from '../user/student.mapper'
import { CompetitionAnswerMapper } from './competition-answer.mapper'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Mapper class để convert từ Prisma CompetitionSubmit model
 * sang Domain CompetitionSubmit entity
 */
export class CompetitionSubmitMapper {
    /**
     * Convert Prisma CompetitionSubmit model sang Domain CompetitionSubmit entity
     */
    static toDomainCompetitionSubmit(prismaSubmit: any): CompetitionSubmit | null {
        if (!prismaSubmit) return null

        return new CompetitionSubmit({
            competitionSubmitId: prismaSubmit.competitionSubmitId,
            competitionId: prismaSubmit.competitionId,
            studentId: prismaSubmit.studentId,
            attemptNumber: prismaSubmit.attemptNumber,
            status: prismaSubmit.status as CompetitionSubmitStatus,
            startedAt: prismaSubmit.startedAt,
            submittedAt: prismaSubmit.submittedAt ?? undefined,
            gradedAt: prismaSubmit.gradedAt ?? undefined,
            totalPoints: prismaSubmit.totalPoints ? this.decimalToNumber(prismaSubmit.totalPoints) : undefined,
            maxPoints: prismaSubmit.maxPoints ? this.decimalToNumber(prismaSubmit.maxPoints) : undefined,
            timeSpentSeconds: prismaSubmit.timeSpentSeconds ?? undefined,
            metadata: prismaSubmit.metadata ?? undefined,
            createdAt: prismaSubmit.createdAt,
            updatedAt: prismaSubmit.updatedAt,
            // Relations
            competition: prismaSubmit.competition
                ? CompetitionMapper.toDomainCompetition(prismaSubmit.competition) || undefined
                : undefined,

            student: prismaSubmit.student
                ? StudentMapper.toDomainStudent(prismaSubmit.student) || undefined
                : undefined,

            competitionAnswers: prismaSubmit.competitionAnswers
                ? prismaSubmit.competitionAnswers.map(
                    CompetitionAnswerMapper.toDomainCompetitionAnswer,
                ).filter(Boolean)
                : undefined,
        })
    }

    /**
     * Convert array Prisma CompetitionSubmits sang array Domain CompetitionSubmits
     */
    static toDomainCompetitionSubmits(prismaSubmits: any[]): CompetitionSubmit[] {
        return prismaSubmits
            .map((item) => this.toDomainCompetitionSubmit(item))
            .filter(Boolean) as CompetitionSubmit[]
    }

    /**
     * Helper: Convert Decimal to number
     */
    private static decimalToNumber(decimal: Decimal | number | null | undefined): number | undefined {
        if (decimal === null || decimal === undefined) return undefined
        if (typeof decimal === 'number') return decimal
        return decimal.toNumber()
    }
}
