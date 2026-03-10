// src/infrastructure/repositories/competition/prisma-competition-submit.repository.ts
import { Injectable } from '@nestjs/common'
import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import {
    ICompetitionSubmitRepository,
    CreateCompetitionSubmitData,
    UpdateCompetitionSubmitData,
    GradeCompetitionSubmitData,
    CompetitionSubmitFilterOptions,
    CompetitionSubmitPaginationOptions,
    CompetitionSubmitListResult,
} from '../../../domain/repositories/competition-submit.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { CompetitionSubmitMapper } from '../../mappers/competition/competition-submit.mapper'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'

@Injectable()
export class PrismaCompetitionSubmitRepository implements ICompetitionSubmitRepository {
    constructor(private readonly prisma: PrismaService | any) {}

    async create(data: CreateCompetitionSubmitData, txClient?: any): Promise<CompetitionSubmit> {
        const client = txClient || this.prisma

        const created = await client.competitionSubmit.create({
            data: {
                competitionId: data.competitionId,
                studentId: data.studentId,
                attemptNumber: data.attemptNumber,
                status: data.status,
                startedAt: data.startedAt,
                submittedAt: data.submittedAt ?? null,
                gradedAt: data.gradedAt ?? null,
                totalPoints: data.totalPoints ?? null,
                maxPoints: data.maxPoints ?? null,
                timeSpentSeconds: data.timeSpentSeconds ?? null,
                metadata: data.metadata ?? null,
            },
            include: {
                competition: {
                    include: {
                        exam: true,
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                student: {
                    include: {
                        user: true,
                    },
                },
                competitionAnswers: {
                    include: {
                        question: true,
                    },
                },
            },
        })

        return CompetitionSubmitMapper.toDomainCompetitionSubmit(created)!
    }

    async findById(id: number, txClient?: any): Promise<CompetitionSubmit | null> {
        const client = txClient || this.prisma

        const submit = await client.competitionSubmit.findUnique({
            where: { competitionSubmitId: id },
            include: {
                competition: {
                    include: {
                        exam: true,
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                student: {
                    include: {
                        user: true,
                    },
                },
                competitionAnswers: {
                    include: {
                        question: true,
                    },
                },
            },
        })

        if (!submit) return null

        return CompetitionSubmitMapper.toDomainCompetitionSubmit(submit)
    }

    async update(id: number, data: UpdateCompetitionSubmitData, txClient?: any): Promise<CompetitionSubmit> {
        const client = txClient || this.prisma

        const updateData: any = {}

        if (data.status !== undefined) updateData.status = data.status
        if (data.submittedAt !== undefined) updateData.submittedAt = data.submittedAt
        if (data.gradedAt !== undefined) updateData.gradedAt = data.gradedAt
        if (data.totalPoints !== undefined) updateData.totalPoints = data.totalPoints
        if (data.maxPoints !== undefined) updateData.maxPoints = data.maxPoints
        if (data.timeSpentSeconds !== undefined) updateData.timeSpentSeconds = data.timeSpentSeconds
        if (data.metadata !== undefined) updateData.metadata = data.metadata

        const updated = await client.competitionSubmit.update({
            where: { competitionSubmitId: id },
            data: updateData,
            include: {
                competition: {
                    include: {
                        exam: true,
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                student: {
                    include: {
                        user: true,
                    },
                },
                competitionAnswers: {
                    include: {
                        question: true,
                    },
                },
            },
        })

        return CompetitionSubmitMapper.toDomainCompetitionSubmit(updated)!
    }

    async delete(id: number, txClient?: any): Promise<void> {
        const client = txClient || this.prisma

        await client.competitionSubmit.delete({
            where: { competitionSubmitId: id },
        })
    }

    async findAll(txClient?: any): Promise<CompetitionSubmit[]> {
        const client = txClient || this.prisma

        const submits = await client.competitionSubmit.findMany({
            where: { student: { user: { isActive: true } } },
            include: {
                competition: true,
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean)
    }

    async findAllWithPagination(
        pagination: CompetitionSubmitPaginationOptions,
        filters?: CompetitionSubmitFilterOptions,
        txClient?: any,
    ): Promise<CompetitionSubmitListResult> {
        const client = txClient || this.prisma

        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'createdAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        const where = this.buildWhereClause(filters)
        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaSubmits, total] = await Promise.all([
            client.competitionSubmit.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    competition: true,
                    student: {
                        include: {
                            user: true,
                        },
                    },
                },
            }),
            client.competitionSubmit.count({ where }),
        ])

        const competitionSubmits = prismaSubmits
            .map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s))
            .filter(Boolean)
        const totalPages = Math.ceil(total / limit)

        return {
            competitionSubmits,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async findByFilters(
        filters: CompetitionSubmitFilterOptions,
        pagination?: CompetitionSubmitPaginationOptions,
        txClient?: any,
    ): Promise<CompetitionSubmitListResult> {
        return this.findAllWithPagination(pagination || {}, filters, txClient)
    }

    async findByCompetition(competitionId: number, txClient?: any): Promise<CompetitionSubmit[]> {
        const client = txClient || this.prisma

        const submits = await client.competitionSubmit.findMany({
            where: { competitionId, student: { user: { isActive: true } } },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
                competitionAnswers: true,
            },
            orderBy: { startedAt: 'desc' },
        })

        return submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean)
    }

    async findByStudent(studentId: number, txClient?: any): Promise<CompetitionSubmit[]> {
        const client = txClient || this.prisma

        const submits = await client.competitionSubmit.findMany({
            where: { studentId, student: { user: { isActive: true } } },
            include: {
                competition: true,
                competitionAnswers: true,
            },
            orderBy: { startedAt: 'desc' },
        })

        return submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean)
    }

    async findByCompetitionAndStudent(
        competitionId: number,
        studentId: number,
        txClient?: any,
    ): Promise<CompetitionSubmit[]> {
        const client = txClient || this.prisma

        const submits = await client.competitionSubmit.findMany({
            where: {
                competitionId,
                studentId,
                student: { user: { isActive: true } },
            },
            include: {
                competition: true,
                student: {
                    include: {
                        user: true,
                    },
                },
                competitionAnswers: {
                    include: {
                        question: true,
                    },
                },
            },
            orderBy: { attemptNumber: 'asc' },
        })

        return submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean)
    }

    async findLatestAttempt(
        competitionId: number,
        studentId: number,
        txClient?: any,
    ): Promise<CompetitionSubmit | null> {
        const client = txClient || this.prisma

        const submit = await client.competitionSubmit.findFirst({
            where: {
                competitionId,
                studentId,
                student: { user: { isActive: true } },
            },
            include: {
                competition: true,
                student: {
                    include: {
                        user: true,
                    },
                },
                competitionAnswers: {
                    include: {
                        question: true,
                    },
                },
            },
            orderBy: { attemptNumber: 'desc' },
        })

        if (!submit) return null

        return CompetitionSubmitMapper.toDomainCompetitionSubmit(submit)
    }

    async findByAttempt(
        competitionId: number,
        studentId: number,
        attemptNumber: number,
        txClient?: any,
    ): Promise<CompetitionSubmit | null> {
        const client = txClient || this.prisma

        const submit = await client.competitionSubmit.findUnique({
            where: {
                competitionId_studentId_attemptNumber: {
                    competitionId,
                    studentId,
                    attemptNumber,
                },
            },
            include: {
                competition: {
                    include: {
                        exam: true,
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                student: {
                    include: {
                        user: true,
                    },
                },
                competitionAnswers: {
                    include: {
                        question: true,
                    },
                },
            },
        })

        if (!submit) return null

        return CompetitionSubmitMapper.toDomainCompetitionSubmit(submit)
    }

    async grade(id: number, data: GradeCompetitionSubmitData, txClient?: any): Promise<CompetitionSubmit> {
        const client = txClient || this.prisma

        const updated = await client.competitionSubmit.update({
            where: { competitionSubmitId: id },
            data: {
                status: CompetitionSubmitStatus.GRADED,
                totalPoints: data.totalPoints,
                maxPoints: data.maxPoints,
                gradedAt: data.gradedAt,
                metadata: data.metadata,
            },
            include: {
                competition: {
                    include: {
                        exam: true,
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                student: {
                    include: {
                        user: true,
                    },
                },
                competitionAnswers: {
                    include: {
                        question: true,
                    },
                },
            },
        })

        return CompetitionSubmitMapper.toDomainCompetitionSubmit(updated)!
    }

    async count(filters?: CompetitionSubmitFilterOptions, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        const where = this.buildWhereClause(filters)
        return client.competitionSubmit.count({ where })
    }

    async countByCompetition(competitionId: number, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        return client.competitionSubmit.count({
            where: { competitionId, student: { user: { isActive: true } } },
        })
    }

    async countByCompetitions(competitionIds: number[], txClient?: any): Promise<Map<number, number>> {
        if (competitionIds.length === 0) return new Map()
        const client = txClient || this.prisma

        const grouped = await client.competitionSubmit.groupBy({
            by: ['competitionId'],
            where: { competitionId: { in: competitionIds }, student: { user: { isActive: true } } },
            _count: { competitionId: true },
        })

        const result = new Map<number, number>()
        for (const row of grouped) {
            result.set(row.competitionId, row._count.competitionId)
        }
        return result
    }

    async countByStudent(studentId: number, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        return client.competitionSubmit.count({
            where: { studentId, student: { user: { isActive: true } } },
        })
    }

    async countByStatus(
        status: CompetitionSubmitStatus,
        competitionId?: number,
        txClient?: any,
    ): Promise<number> {
        const client = txClient || this.prisma
        const where: any = { status, student: { user: { isActive: true } } }
        if (competitionId !== undefined) {
            where.competitionId = competitionId
        }
        return client.competitionSubmit.count({ where })
    }

    async countGradedSubmits(competitionId?: number, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        const where: any = {
            status: CompetitionSubmitStatus.GRADED,
            student: { user: { isActive: true } },
        }
        if (competitionId !== undefined) {
            where.competitionId = competitionId
        }
        return client.competitionSubmit.count({ where })
    }

    async countUngradedSubmits(competitionId?: number, txClient?: any): Promise<number> {
        const client = txClient || this.prisma
        const where: any = {
            status: {
                in: [CompetitionSubmitStatus.SUBMITTED, CompetitionSubmitStatus.IN_PROGRESS],
            },
            student: { user: { isActive: true } },
        }
        if (competitionId !== undefined) {
            where.competitionId = competitionId
        }
        return client.competitionSubmit.count({ where })
    }

    async getLeaderboard(competitionId: number, limit: number = 10, txClient?: any): Promise<CompetitionSubmit[]> {
        const client = txClient || this.prisma

        const submits = await client.competitionSubmit.findMany({
            where: {
                competitionId,
                status: CompetitionSubmitStatus.GRADED,
                totalPoints: { not: null },
                student: { user: { isActive: true } },
            },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
                competition: true,
            },
            orderBy: [{ totalPoints: 'desc' }, { submittedAt: 'asc' }],
            take: limit,
        })

        return submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean)
    }

    async getPaginatedLeaderboard(
        competitionId: number,
        page: number = 1,
        limit: number = 10,
        txClient?: any,
    ): Promise<{ submits: CompetitionSubmit[], total: number }> {
        const client = txClient || this.prisma

        const skip = (page - 1) * limit

        const where = {
            competitionId,
            status: CompetitionSubmitStatus.GRADED,
            totalPoints: { not: null },
            student: { user: { isActive: true } },
        }

        const [submits, total] = await Promise.all([
            client.competitionSubmit.findMany({
                where,
                include: {
                    student: {
                        include: {
                            user: true,
                        },
                    },
                    competition: true,
                },
                orderBy: [
                    { totalPoints: 'desc' },
                    { timeSpentSeconds: 'asc' }, // Nếu điểm bằng nhau, ưu tiên người làm nhanh hơn
                    { submittedAt: 'asc' },
                ],
                skip,
                take: limit,
            }),
            client.competitionSubmit.count({ where }),
        ])

        return {
            submits: submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean),
            total,
        }
    }

    /**
     * Lấy chi tiết đầy đủ bài nộp cho admin:
     * bao gồm competition, student, và mỗi answer kèm đầy đủ
     * question + tất cả statements (có isCorrect).
     */
    async findByIdWithFullDetails(id: number, txClient?: any): Promise<CompetitionSubmit | null> {
        const client = txClient || this.prisma

        const submit = await client.competitionSubmit.findUnique({
            where: { competitionSubmitId: id },
            include: {
                competition: {
                    include: {
                        exam: true,
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                student: {
                    include: {
                        user: true,
                    },
                },
                competitionAnswers: {
                    orderBy: { questionId: 'asc' },
                    include: {
                        question: {
                            include: {
                                statements: {
                                    orderBy: { order: 'asc' },
                                },
                            },
                        },
                    },
                },
            },
        })

        if (!submit) return null

        return CompetitionSubmitMapper.toDomainCompetitionSubmit(submit)
    }

    async findStudentHistory(
        competitionId: number,
        studentId: number,
        pagination: CompetitionSubmitPaginationOptions,
        txClient?: any,
    ): Promise<CompetitionSubmitListResult> {
        const client = txClient || this.prisma

        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'submittedAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        const where: any = {
            competitionId,
            studentId,
            status: {
                notIn: [
                    CompetitionSubmitStatus.IN_PROGRESS,
                    CompetitionSubmitStatus.ABANDONED,
                ],
            },
        }

        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaSubmits, total] = await Promise.all([
            client.competitionSubmit.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    competition: true,
                    student: {
                        include: { user: true },
                    },
                },
            }),
            client.competitionSubmit.count({ where }),
        ])

        const competitionSubmits = prismaSubmits
            .map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s))
            .filter(Boolean)
        const totalPages = Math.ceil(total / limit)

        return {
            competitionSubmits,
            total,
            page,
            limit,
            totalPages,
        }
    }

    private buildWhereClause(filters?: CompetitionSubmitFilterOptions): any {
        const where: any = { student: { user: { isActive: true } } }

        if (!filters) return where

        if (filters.competitionId !== undefined) {
            where.competitionId = filters.competitionId
        }

        if (filters.studentId !== undefined) {
            where.studentId = filters.studentId
        }

        if (filters.status) {
            where.status = filters.status
        }

        if (filters.attemptNumber !== undefined) {
            where.attemptNumber = filters.attemptNumber
        }

        if (filters.startedFrom) {
            where.startedAt = { ...where.startedAt, gte: filters.startedFrom }
        }

        if (filters.startedTo) {
            where.startedAt = { ...where.startedAt, lte: filters.startedTo }
        }

        if (filters.submittedFrom) {
            where.submittedAt = { ...where.submittedAt, gte: filters.submittedFrom }
        }

        if (filters.submittedTo) {
            where.submittedAt = { ...where.submittedAt, lte: filters.submittedTo }
        }

        if (filters.isGraded !== undefined) {
            if (filters.isGraded) {
                where.status = CompetitionSubmitStatus.GRADED
            } else {
                where.status = {
                    not: CompetitionSubmitStatus.GRADED,
                }
            }
        }

        return where
    }
}
