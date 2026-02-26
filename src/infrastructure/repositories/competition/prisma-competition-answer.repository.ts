// src/infrastructure/repositories/competition/prisma-competition-answer.repository.ts
import { Injectable } from '@nestjs/common'
import { CompetitionAnswer } from '../../../domain/entities/exam/competition-answer.entity'
import {
    ICompetitionAnswerRepository,
    CreateCompetitionAnswerData,
    UpdateCompetitionAnswerData,
    GradeCompetitionAnswerData,
    CompetitionAnswerFilterOptions,
    CompetitionAnswerPaginationOptions,
    CompetitionAnswerListResult,
} from '../../../domain/repositories/competition-answer.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { CompetitionAnswerMapper } from '../../mappers/competition/competition-answer.mapper'

@Injectable()
export class PrismaCompetitionAnswerRepository implements ICompetitionAnswerRepository {
    constructor(private readonly prisma: PrismaService | any) {}

    async create(data: CreateCompetitionAnswerData, txClient?: any): Promise<CompetitionAnswer> {
        const client = txClient || this.prisma

        const created = await client.competitionAnswer.create({
            data: {
                competitionSubmitId: data.competitionSubmitId,
                questionId: data.questionId,
                answer: data.answer ?? null,
                selectedStatementIds: data.selectedStatementIds ? JSON.stringify(data.selectedStatementIds) : null,
                isCorrect: data.isCorrect ?? null,
                points: data.points ?? null,
                maxPoints: data.maxPoints ?? null,
                timeSpentSeconds: data.timeSpentSeconds ?? null,
            },
            include: {
                competitionSubmit: {
                    include: {
                        competition: true,
                        student: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                question: true,
            },
        })

        return CompetitionAnswerMapper.toDomainCompetitionAnswer(created)!
    }

    async createMany(data: CreateCompetitionAnswerData[], txClient?: any): Promise<CompetitionAnswer[]> {
        const client = txClient || this.prisma

        const answers = await Promise.all(
            data.map((answerData) => this.create(answerData, client)),
        )

        return answers
    }

    async findById(id: number, txClient?: any): Promise<CompetitionAnswer | null> {
        const client = txClient || this.prisma

        const answer = await client.competitionAnswer.findUnique({
            where: { competitionAnswerId: id },
            include: {
                competitionSubmit: {
                    include: {
                        competition: true,
                        student: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                question: true,
            },
        })

        if (!answer) return null

        return CompetitionAnswerMapper.toDomainCompetitionAnswer(answer)
    }

    async update(id: number, data: UpdateCompetitionAnswerData, txClient?: any): Promise<CompetitionAnswer> {
        const client = txClient || this.prisma

        const updateData: any = {}

        if (data.answer !== undefined) updateData.answer = data.answer
        if (data.selectedStatementIds !== undefined) {
            updateData.selectedStatementIds = data.selectedStatementIds
                ? JSON.stringify(data.selectedStatementIds)
                : null
        }
        if (data.isCorrect !== undefined) updateData.isCorrect = data.isCorrect
        if (data.points !== undefined) updateData.points = data.points
        if (data.maxPoints !== undefined) updateData.maxPoints = data.maxPoints
        if (data.timeSpentSeconds !== undefined) updateData.timeSpentSeconds = data.timeSpentSeconds

        const updated = await client.competitionAnswer.update({
            where: { competitionAnswerId: id },
            data: updateData,
            include: {
                competitionSubmit: {
                    include: {
                        competition: true,
                        student: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                question: true,
            },
        })

        return CompetitionAnswerMapper.toDomainCompetitionAnswer(updated)!
    }

    async updateMany(
        updates: { id: number; data: UpdateCompetitionAnswerData }[],
        txClient?: any,
    ): Promise<CompetitionAnswer[]> {
        const client = txClient || this.prisma

        const updatedAnswers = await Promise.all(
            updates.map((update) => this.update(update.id, update.data, client)),
        )

        return updatedAnswers
    }

    async delete(id: number, txClient?: any): Promise<void> {
        const client = txClient || this.prisma

        await client.competitionAnswer.delete({
            where: { competitionAnswerId: id },
        })
    }

    async deleteMany(ids: number[], txClient?: any): Promise<void> {
        const client = txClient || this.prisma

        await client.competitionAnswer.deleteMany({
            where: {
                competitionAnswerId: {
                    in: ids,
                },
            },
        })
    }

    async findAll(txClient?: any): Promise<CompetitionAnswer[]> {
        const client = txClient || this.prisma

        const answers = await client.competitionAnswer.findMany({
            include: {
                competitionSubmit: true,
                question: true,
            },
        })

        return answers.map((a: any) => CompetitionAnswerMapper.toDomainCompetitionAnswer(a)).filter(Boolean)
    }

    async findAllWithPagination(
        pagination: CompetitionAnswerPaginationOptions,
        filters?: CompetitionAnswerFilterOptions,
        txClient?: any,
    ): Promise<CompetitionAnswerListResult> {
        const client = txClient || this.prisma

        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'createdAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        const where = this.buildWhereClause(filters)
        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaAnswers, total] = await Promise.all([
            client.competitionAnswer.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    competitionSubmit: true,
                    question: true,
                },
            }),
            client.competitionAnswer.count({ where }),
        ])

        const competitionAnswers = prismaAnswers
            .map((a: any) => CompetitionAnswerMapper.toDomainCompetitionAnswer(a))
            .filter(Boolean)
        const totalPages = Math.ceil(total / limit)

        return {
            competitionAnswers,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async findByFilters(
        filters: CompetitionAnswerFilterOptions,
        pagination?: CompetitionAnswerPaginationOptions,
        txClient?: any,
    ): Promise<CompetitionAnswerListResult> {
        return this.findAllWithPagination(pagination || {}, filters, txClient)
    }

    async findByCompetitionSubmit(competitionSubmitId: number, txClient?: any): Promise<CompetitionAnswer[]> {
        const client = txClient || this.prisma

        const answers = await client.competitionAnswer.findMany({
            where: { competitionSubmitId },
            include: {
                question: true,
            },
            orderBy: { createdAt: 'asc' },
        })

        return answers.map((a: any) => CompetitionAnswerMapper.toDomainCompetitionAnswer(a)).filter(Boolean)
    }

    async findByQuestion(questionId: number, txClient?: any): Promise<CompetitionAnswer[]> {
        const client = txClient || this.prisma

        const answers = await client.competitionAnswer.findMany({
            where: { questionId },
            include: {
                competitionSubmit: {
                    include: {
                        student: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return answers.map((a: any) => CompetitionAnswerMapper.toDomainCompetitionAnswer(a)).filter(Boolean)
    }

    async findBySubmitAndQuestion(
        competitionSubmitId: number,
        questionId: number,
        txClient?: any,
    ): Promise<CompetitionAnswer | null> {
        const client = txClient || this.prisma

        const answer = await client.competitionAnswer.findUnique({
            where: {
                competitionSubmitId_questionId: {
                    competitionSubmitId,
                    questionId,
                },
            },
            include: {
                competitionSubmit: {
                    include: {
                        competition: true,
                        student: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                question: true,
            },
        })

        if (!answer) return null

        return CompetitionAnswerMapper.toDomainCompetitionAnswer(answer)
    }

    async grade(id: number, data: GradeCompetitionAnswerData, txClient?: any): Promise<CompetitionAnswer> {
        const client = txClient || this.prisma

        const updated = await client.competitionAnswer.update({
            where: { competitionAnswerId: id },
            data: {
                isCorrect: data.isCorrect,
                points: data.points,
                maxPoints: data.maxPoints,
            },
            include: {
                competitionSubmit: {
                    include: {
                        competition: true,
                        student: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                question: true,
            },
        })

        return CompetitionAnswerMapper.toDomainCompetitionAnswer(updated)!
    }

    async gradeMany(
        grades: { id: number; data: GradeCompetitionAnswerData }[],
        txClient?: any,
    ): Promise<CompetitionAnswer[]> {
        const client = txClient || this.prisma

        const gradedAnswers = await Promise.all(
            grades.map((grade) => this.grade(grade.id, grade.data, client)),
        )

        return gradedAnswers
    }

    async count(filters?: CompetitionAnswerFilterOptions, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        const where = this.buildWhereClause(filters)
        return client.competitionAnswer.count({ where })
    }

    async countByCompetitionSubmit(competitionSubmitId: number, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        return client.competitionAnswer.count({
            where: { competitionSubmitId },
        })
    }

    async countByQuestion(questionId: number, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        return client.competitionAnswer.count({
            where: { questionId },
        })
    }

    async countCorrectAnswers(competitionSubmitId: number, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        return client.competitionAnswer.count({
            where: {
                competitionSubmitId,
                isCorrect: true,
            },
        })
    }

    async countIncorrectAnswers(competitionSubmitId: number, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        return client.competitionAnswer.count({
            where: {
                competitionSubmitId,
                isCorrect: false,
            },
        })
    }

    async countGradedAnswers(competitionSubmitId: number, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        return client.competitionAnswer.count({
            where: {
                competitionSubmitId,
                isCorrect: {
                    not: null,
                },
            },
        })
    }

    async countUngradedAnswers(competitionSubmitId: number, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        return client.competitionAnswer.count({
            where: {
                competitionSubmitId,
                isCorrect: null,
            },
        })
    }

    async calculateTotalPoints(
        competitionSubmitId: number,
        txClient?: any,
    ): Promise<{ totalPoints: number; maxPoints: number }> {
        const client = txClient || this.prisma

        const result = await client.competitionAnswer.aggregate({
            where: { competitionSubmitId },
            _sum: {
                points: true,
                maxPoints: true,
            },
        })

        return {
            totalPoints: result._sum.points || 0,
            maxPoints: result._sum.maxPoints || 0,
        }
    }

    private buildWhereClause(filters?: CompetitionAnswerFilterOptions): any {
        const where: any = {}

        if (!filters) return where

        if (filters.competitionSubmitId !== undefined) {
            where.competitionSubmitId = filters.competitionSubmitId
        }

        if (filters.questionId !== undefined) {
            where.questionId = filters.questionId
        }

        if (filters.isCorrect !== undefined) {
            where.isCorrect = filters.isCorrect
        }

        if (filters.hasAnswer !== undefined) {
            if (filters.hasAnswer) {
                where.OR = [
                    { answer: { not: null } },
                    { selectedStatementIds: { not: null } },
                ]
            } else {
                where.answer = null
                where.selectedStatementIds = null
            }
        }

        return where
    }
}
