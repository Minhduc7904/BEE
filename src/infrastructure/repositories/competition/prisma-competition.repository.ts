// src/infrastructure/repositories/competition/prisma-competition.repository.ts
import { Injectable } from '@nestjs/common'
import { Competition } from '../../../domain/entities/exam/competition.entity'
import {
    ICompetitionRepository,
    CreateCompetitionData,
    CompetitionFilterOptions,
    CompetitionPaginationOptions,
    CompetitionListResult,
} from '../../../domain/repositories/competition.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { CompetitionMapper } from '../../mappers/competition/competition.mapper'

@Injectable()
export class PrismaCompetitionRepository implements ICompetitionRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateCompetitionData, txClient?: any): Promise<Competition> {
        const client = txClient || this.prisma

        const created = await client.competition.create({
            data: {
                title: data.title,
                subtitle: data.subtitle,
                startDate: data.startDate ?? null,
                endDate: data.endDate ?? null,
                policies: data.policies,
                visibility: data.visibility,
                durationMinutes: data.durationMinutes,
                maxAttempts: data.maxAttempts,
                showResultDetail: data.showResultDetail ?? false,
                allowLeaderboard: data.allowLeaderboard ?? false,
                allowViewScore: data.allowViewScore ?? true,
                allowViewAnswer: data.allowViewAnswer ?? false,
                enableAntiCheating: data.enableAntiCheating ?? false,
                allowViewSolutionYoutubeUrl: data.allowViewSolutionYoutubeUrl ?? false,
                allowViewExamContent: data.allowViewExamContent ?? false,
                admin: {
                    connect: { adminId: data.adminId },
                },
                ...(data.examId && {
                    exam: {
                        connect: { examId: data.examId },
                    },
                }),
            },
        })

        return CompetitionMapper.toDomainCompetition(created)!
    }

    async findById(id: number, txClient?: any): Promise<Competition | null> {
        const client = txClient || this.prisma

        const competition = await client.competition.findUnique({
            where: { competitionId: id },
            include: {
                exam: true,
                admin: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        if (!competition) return null

        return CompetitionMapper.toDomainCompetition(competition)
    }

    async update(id: number, data: Partial<CreateCompetitionData>, txClient?: any): Promise<Competition> {
        const client = txClient || this.prisma

        const updateData: any = {}

        if (data.title !== undefined) updateData.title = data.title
        if (data.subtitle !== undefined) updateData.subtitle = data.subtitle
        if (data.startDate !== undefined) updateData.startDate = data.startDate
        if (data.endDate !== undefined) updateData.endDate = data.endDate
        if (data.policies !== undefined) updateData.policies = data.policies
        if (data.visibility !== undefined) updateData.visibility = data.visibility
        if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes
        if (data.maxAttempts !== undefined) updateData.maxAttempts = data.maxAttempts
        if (data.showResultDetail !== undefined) updateData.showResultDetail = data.showResultDetail
        if (data.allowLeaderboard !== undefined) updateData.allowLeaderboard = data.allowLeaderboard
        if (data.allowViewScore !== undefined) updateData.allowViewScore = data.allowViewScore
        if (data.allowViewAnswer !== undefined) updateData.allowViewAnswer = data.allowViewAnswer
        if (data.enableAntiCheating !== undefined) updateData.enableAntiCheating = data.enableAntiCheating
        if (data.allowViewSolutionYoutubeUrl !== undefined) updateData.allowViewSolutionYoutubeUrl = data.allowViewSolutionYoutubeUrl
        if (data.allowViewExamContent !== undefined) updateData.allowViewExamContent = data.allowViewExamContent
        if (data.examId !== undefined) updateData.examId = data.examId

        const updated = await client.competition.update({
            where: { competitionId: id },
            data: updateData,
            include: {
                exam: true,
                admin: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return CompetitionMapper.toDomainCompetition(updated)!
    }

    async delete(id: number, txClient?: any): Promise<void> {
        const client = txClient || this.prisma

        await client.competition.delete({
            where: { competitionId: id },
        })
    }

    async findAllWithPagination(
        pagination: CompetitionPaginationOptions,
        filters?: CompetitionFilterOptions,
        txClient?: any,
    ): Promise<CompetitionListResult> {
        const client = txClient || this.prisma

        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'createdAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search } },
                { subtitle: { contains: filters.search } },
                { policies: { contains: filters.search } },
            ]
        }

        if (filters?.examId !== undefined) {
            where.examId = filters.examId
        }

        if (filters?.visibility) {
            where.visibility = filters.visibility
        }

        if (filters?.excludeVisibility) {
            where.visibility = { not: filters.excludeVisibility }
        }

        if (filters?.createdBy !== undefined) {
            where.createdBy = filters.createdBy
        }

        if (filters?.startDateFrom) {
            where.startDate = { gte: filters.startDateFrom }
        }

        if (filters?.endDateTo) {
            where.endDate = { lte: filters.endDateTo }
        }

        // Build orderBy
        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaCompetitions, total] = await Promise.all([
            client.competition.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    exam: true,
                    admin: {
                        include: {
                            user: true,
                        },
                    },
                },
            }),
            client.competition.count({ where }),
        ])

        const competitions = CompetitionMapper.toDomainCompetitions(prismaCompetitions)
        const totalPages = Math.ceil(total / limit)

        return {
            competitions,
            total,
            page,
            limit,
            totalPages,
        }
    }
}
