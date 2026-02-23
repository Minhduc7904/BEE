// src/infrastructure/repositories/prisma-learning-item.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { ILearningItemRepository } from '../../../domain/repositories'
import type {
    CreateLearningItemData,
    UpdateLearningItemData,
    LearningItemFilterOptions,
    LearningItemPaginationOptions,
    LearningItemListResult,
} from '../../../domain/interface'
import { LearningItem } from '../../../domain/entities'
import { LearningItemMapper } from '../../mappers'
import { NumberUtil } from '../../../shared/utils'
import { LearningItemType } from '../../../shared/enums'

export class PrismaLearningItemRepository implements ILearningItemRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateLearningItemData): Promise<LearningItem> {
        const prismaLearningItem = await this.prisma.learningItem.create({
            data: {
                type: data.type,
                title: data.title,
                description: data.description,
                competitionId: data.competitionId,
                createdBy: data.createdBy,
            },
            include: {
                admin: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return LearningItemMapper.toDomainLearningItem(prismaLearningItem)!
    }

    async findById(id: number): Promise<LearningItem | null> {
        const numericId = NumberUtil.ensureValidId(id, 'LearningItem ID')

        const prismaLearningItem = await this.prisma.learningItem.findUnique({
            where: { learningItemId: numericId },
            include: {
                admin: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        if (!prismaLearningItem) return null
        return LearningItemMapper.toDomainLearningItem(prismaLearningItem)!
    }

    async findByIdWithContents(id: number): Promise<LearningItem | null> {
        const numericId = NumberUtil.ensureValidId(id, 'LearningItem ID')

        const prismaLearningItem = await this.prisma.learningItem.findUnique({
            where: { learningItemId: numericId },
            include: {
                admin: {
                    include: {
                        user: true,
                    },
                },
                homeworkContents: {
                    include: {
                        competition: {
                            include: {
                                exam: true,
                            },
                        },
                    },
                },
                documentContents: true,
                youtubeContents: true,
                videoContents: true,
            },
        })

        if (!prismaLearningItem) return null
        return LearningItemMapper.toDomainLearningItem(prismaLearningItem)!
    }

    async update(id: number, data: UpdateLearningItemData): Promise<LearningItem> {
        const numericId = NumberUtil.ensureValidId(id, 'LearningItem ID')

        const prismaLearningItem = await this.prisma.learningItem.update({
            where: { learningItemId: numericId },
            data: {
                ...data,
            },
            include: {
                admin: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return LearningItemMapper.toDomainLearningItem(prismaLearningItem)!
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'LearningItem ID')

        await this.prisma.learningItem.delete({
            where: { learningItemId: numericId },
        })

        return true
    }

    async findAll(): Promise<LearningItem[]> {
        const prismaLearningItems = await this.prisma.learningItem.findMany({
            include: {
                admin: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return LearningItemMapper.toDomainLearningItems(prismaLearningItems)
    }

    async findAllWithPagination(
        pagination: LearningItemPaginationOptions,
        filters?: LearningItemFilterOptions,
    ): Promise<LearningItemListResult> {
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
                { description: { contains: filters.search } },
            ]
        }

        if (filters?.type !== undefined) {
            where.type = filters.type
        }

        if (filters?.createdBy !== undefined) {
            where.createdBy = filters.createdBy
        }

        if (filters?.competitionId !== undefined) {
            where.competitionId = filters.competitionId
        }

        // Build orderBy
        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaLearningItems, total] = await Promise.all([
            this.prisma.learningItem.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    admin: {
                        include: {
                            user: true,
                        },
                    },
                },
            }),
            this.prisma.learningItem.count({ where }),
        ])

        const learningItems = LearningItemMapper.toDomainLearningItems(prismaLearningItems)
        const totalPages = Math.ceil(total / limit)

        return {
            learningItems,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async searchLearningItems(searchTerm: string, pagination?: LearningItemPaginationOptions): Promise<LearningItemListResult> {
        return this.findAllWithPagination(pagination || {}, { search: searchTerm })
    }

    async findByFilters(
        filters: LearningItemFilterOptions,
        pagination?: LearningItemPaginationOptions,
    ): Promise<LearningItemListResult> {
        return this.findAllWithPagination(pagination || {}, filters)
    }

    async findByType(type: LearningItemType): Promise<LearningItem[]> {
        const prismaLearningItems = await this.prisma.learningItem.findMany({
            where: { type },
            include: {
                admin: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return LearningItemMapper.toDomainLearningItems(prismaLearningItems)
    }

    async findByCreator(createdBy: number): Promise<LearningItem[]> {
        const numericCreatedBy = NumberUtil.ensureValidId(createdBy, 'Creator ID')

        const prismaLearningItems = await this.prisma.learningItem.findMany({
            where: { createdBy: numericCreatedBy },
            include: {
                admin: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return LearningItemMapper.toDomainLearningItems(prismaLearningItems)
    }

    async findByCompetition(competitionId: number): Promise<LearningItem[]> {
        const numericCompetitionId = NumberUtil.ensureValidId(competitionId, 'Competition ID')

        const prismaLearningItems = await this.prisma.learningItem.findMany({
            where: { competitionId: numericCompetitionId },
            include: {
                admin: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return LearningItemMapper.toDomainLearningItems(prismaLearningItems)
    }

    async count(filters?: LearningItemFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search } },
                { description: { contains: filters.search } },
            ]
        }

        if (filters?.type !== undefined) {
            where.type = filters.type
        }

        if (filters?.createdBy !== undefined) {
            where.createdBy = filters.createdBy
        }

        if (filters?.competitionId !== undefined) {
            where.competitionId = filters.competitionId
        }

        return this.prisma.learningItem.count({ where })
    }

    async countByType(type: LearningItemType): Promise<number> {
        return this.prisma.learningItem.count({
            where: { type },
        })
    }

    async countByCreator(createdBy: number): Promise<number> {
        const numericCreatedBy = NumberUtil.ensureValidId(createdBy, 'Creator ID')

        return this.prisma.learningItem.count({
            where: { createdBy: numericCreatedBy },
        })
    }
}
