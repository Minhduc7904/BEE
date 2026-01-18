// src/infrastructure/repositories/prisma-youtube-content.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { IYoutubeContentRepository } from '../../../domain/repositories'
import type {
    CreateYoutubeContentData,
    UpdateYoutubeContentData,
    YoutubeContentFilterOptions,
    YoutubeContentPaginationOptions,
    YoutubeContentListResult,
} from '../../../domain/interface'
import { YoutubeContent } from '../../../domain/entities'
import { YoutubeContentMapper } from '../../mappers/learning-item/youtube-content.mapper'
import { NumberUtil } from '../../../shared/utils'

export class PrismaYoutubeContentRepository implements IYoutubeContentRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateYoutubeContentData): Promise<YoutubeContent> {
        const prismaYoutubeContent = await this.prisma.youtubeContent.create({
            data: {
                learningItemId: data.learningItemId,
                content: data.content,
                youtubeUrl: data.youtubeUrl,
            },
            include: {
                learningItem: {
                    include: {
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return YoutubeContentMapper.toDomainYoutubeContent(prismaYoutubeContent)!
    }

    async findById(id: number): Promise<YoutubeContent | null> {
        const numericId = NumberUtil.ensureValidId(id, 'YoutubeContent ID')

        const prismaYoutubeContent = await this.prisma.youtubeContent.findUnique({
            where: { youtubeContentId: numericId },
            include: {
                learningItem: {
                    include: {
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        if (!prismaYoutubeContent) return null
        return YoutubeContentMapper.toDomainYoutubeContent(prismaYoutubeContent)!
    }

    async update(id: number, data: UpdateYoutubeContentData): Promise<YoutubeContent> {
        const numericId = NumberUtil.ensureValidId(id, 'YoutubeContent ID')

        const prismaYoutubeContent = await this.prisma.youtubeContent.update({
            where: { youtubeContentId: numericId },
            data: {
                ...data,
            },
            include: {
                learningItem: {
                    include: {
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return YoutubeContentMapper.toDomainYoutubeContent(prismaYoutubeContent)!
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'YoutubeContent ID')

        await this.prisma.youtubeContent.delete({
            where: { youtubeContentId: numericId },
        })

        return true
    }

    async findAll(): Promise<YoutubeContent[]> {
        const prismaYoutubeContents = await this.prisma.youtubeContent.findMany({
            include: {
                learningItem: {
                    include: {
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return YoutubeContentMapper.toDomainYoutubeContents(prismaYoutubeContents)
    }

    async findAllWithPagination(
        pagination: YoutubeContentPaginationOptions,
        filters?: YoutubeContentFilterOptions,
    ): Promise<YoutubeContentListResult> {
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'createdAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}

        if (filters?.learningItemId) {
            where.learningItemId = filters.learningItemId
        }

        if (filters?.search) {
            where.OR = [
                { content: { contains: filters.search } },
                { youtubeUrl: { contains: filters.search } },
            ]
        }

        // Execute query with pagination
        const [prismaYoutubeContents, total] = await Promise.all([
            this.prisma.youtubeContent.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    learningItem: {
                        include: {
                            admin: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.youtubeContent.count({ where }),
        ])

        const youtubeContents = YoutubeContentMapper.toDomainYoutubeContents(prismaYoutubeContents)

        return {
            youtubeContents,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }

    async searchYoutubeContents(
        searchTerm: string,
        pagination?: YoutubeContentPaginationOptions,
    ): Promise<YoutubeContentListResult> {
        return this.findAllWithPagination(
            pagination || {},
            { search: searchTerm },
        )
    }

    async findByFilters(
        filters: YoutubeContentFilterOptions,
        pagination?: YoutubeContentPaginationOptions,
    ): Promise<YoutubeContentListResult> {
        return this.findAllWithPagination(pagination || {}, filters)
    }

    async findByLearningItem(learningItemId: number): Promise<YoutubeContent[]> {
        const numericId = NumberUtil.ensureValidId(learningItemId, 'LearningItem ID')

        const prismaYoutubeContents = await this.prisma.youtubeContent.findMany({
            where: { learningItemId: numericId },
            include: {
                learningItem: {
                    include: {
                        admin: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return YoutubeContentMapper.toDomainYoutubeContents(prismaYoutubeContents)
    }

    async count(filters?: YoutubeContentFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.learningItemId) {
            where.learningItemId = filters.learningItemId
        }

        if (filters?.search) {
            where.OR = [
                { content: { contains: filters.search } },
                { youtubeUrl: { contains: filters.search } },
            ]
        }

        return this.prisma.youtubeContent.count({ where })
    }

    async countByLearningItem(learningItemId: number): Promise<number> {
        const numericId = NumberUtil.ensureValidId(learningItemId, 'LearningItem ID')

        return this.prisma.youtubeContent.count({
            where: { learningItemId: numericId },
        })
    }
}
