// src/infrastructure/mappers/competition/competition-answer.mapper.ts

import { CompetitionAnswer } from '../../../domain/entities/exam/competition-answer.entity'
import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import { Question } from '../../../domain/entities/exam/question.entity'
import { CompetitionSubmitMapper } from './competition-submit.mapper'
import { QuestionMapper } from '../exam/question.mapper'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Mapper class để convert từ Prisma CompetitionAnswer model
 * sang Domain CompetitionAnswer entity
 */
export class CompetitionAnswerMapper {
    /**
     * Convert Prisma CompetitionAnswer model sang Domain CompetitionAnswer entity
     */
    static toDomainCompetitionAnswer(prismaAnswer: any): CompetitionAnswer | null {
        if (!prismaAnswer) return null

        return new CompetitionAnswer({
            competitionAnswerId: prismaAnswer.competitionAnswerId,
            competitionSubmitId: prismaAnswer.competitionSubmitId,
            questionId: prismaAnswer.questionId,
            answer: prismaAnswer.answer ?? undefined,
            selectedStatementIds: prismaAnswer.selectedStatementIds 
                ? (Array.isArray(prismaAnswer.selectedStatementIds) 
                    ? prismaAnswer.selectedStatementIds 
                    : JSON.parse(prismaAnswer.selectedStatementIds))
                : undefined,
            isCorrect: prismaAnswer.isCorrect ?? undefined,
            points: prismaAnswer.points ? this.decimalToNumber(prismaAnswer.points) : undefined,
            maxPoints: prismaAnswer.maxPoints ? this.decimalToNumber(prismaAnswer.maxPoints) : undefined,
            timeSpentSeconds: prismaAnswer.timeSpentSeconds ?? undefined,
            createdAt: prismaAnswer.createdAt,
            updatedAt: prismaAnswer.updatedAt,

            // Relations
            competitionSubmit: prismaAnswer.competitionSubmit
                ? CompetitionSubmitMapper.toDomainCompetitionSubmit(prismaAnswer.competitionSubmit) || undefined
                : undefined,

            question: prismaAnswer.question
                ? QuestionMapper.toDomainQuestion(prismaAnswer.question) || undefined
                : undefined,
        })
    }

    /**
     * Convert array Prisma CompetitionAnswers sang array Domain CompetitionAnswers
     */
    static toDomainCompetitionAnswers(prismaAnswers: any[]): CompetitionAnswer[] {
        return prismaAnswers
            .map((item) => this.toDomainCompetitionAnswer(item))
            .filter(Boolean) as CompetitionAnswer[]
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
