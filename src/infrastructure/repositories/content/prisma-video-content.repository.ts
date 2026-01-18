// src/infrastructure/repositories/prisma-video-content.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { IVideoContentRepository } from '../../../domain/repositories'
import type {
    CreateVideoContentData,
    UpdateVideoContentData,
    VideoContentFilterOptions,
    VideoContentPaginationOptions,
    VideoContentListResult,
} from '../../../domain/interface'
import { VideoContent } from '../../../domain/entities'
import { VideoContentMapper } from '../../mappers/learning-item/video-content.mapper'
import { NumberUtil } from '../../../shared/utils'

export class PrismaVideoContentRepository implements IVideoContentRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateVideoContentData): Promise<VideoContent> {
        const prismaVideoContent = await this.prisma.videoContent.create({
            data: {
                learningItemId: data.learningItemId,
                content: data.content,
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

        return VideoContentMapper.toDomainVideoContent(prismaVideoContent)!
    }

    async findById(id: number): Promise<VideoContent | null> {
        const numericId = NumberUtil.ensureValidId(id, 'VideoContent ID')

        const prismaVideoContent = await this.prisma.videoContent.findUnique({
            where: { videoContentId: numericId },
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

        if (!prismaVideoContent) return null
        return VideoContentMapper.toDomainVideoContent(prismaVideoContent)!
    }

    async update(id: number, data: UpdateVideoContentData): Promise<VideoContent> {
        const numericId = NumberUtil.ensureValidId(id, 'VideoContent ID')

        const prismaVideoContent = await this.prisma.videoContent.update({
            where: { videoContentId: numericId },
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

        return VideoContentMapper.toDomainVideoContent(prismaVideoContent)!
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'VideoContent ID')

        await this.prisma.videoContent.delete({
            where: { videoContentId: numericId },
        })

        return true
    }

    async findAll(): Promise<VideoContent[]> {
        const prismaVideoContents = await this.prisma.videoContent.findMany({
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

        return VideoContentMapper.toDomainVideoContents(prismaVideoContents)
    }

    async findAllWithPagination(
        pagination: VideoContentPaginationOptions,
        filters?: VideoContentFilterOptions,
    ): Promise<VideoContentListResult> {
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
            ]
        }

        // Execute query with pagination
        const [prismaVideoContents, total] = await Promise.all([
            this.prisma.videoContent.findMany({
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
            this.prisma.videoContent.count({ where }),
        ])

        const videoContents = VideoContentMapper.toDomainVideoContents(prismaVideoContents)

        return {
            videoContents,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }

    async searchVideoContents(
        searchTerm: string,
        pagination?: VideoContentPaginationOptions,
    ): Promise<VideoContentListResult> {
        return this.findAllWithPagination(
            pagination || {},
            { search: searchTerm },
        )
    }

    async findByFilters(
        filters: VideoContentFilterOptions,
        pagination?: VideoContentPaginationOptions,
    ): Promise<VideoContentListResult> {
        return this.findAllWithPagination(pagination || {}, filters)
    }

    async findByLearningItem(learningItemId: number): Promise<VideoContent[]> {
        const numericId = NumberUtil.ensureValidId(learningItemId, 'LearningItem ID')

        const prismaVideoContents = await this.prisma.videoContent.findMany({
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

        return VideoContentMapper.toDomainVideoContents(prismaVideoContents)
    }

    async count(filters?: VideoContentFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.learningItemId) {
            where.learningItemId = filters.learningItemId
        }

        if (filters?.search) {
            where.OR = [
                { content: { contains: filters.search } },
            ]
        }

        return this.prisma.videoContent.count({ where })
    }

    async countByLearningItem(learningItemId: number): Promise<number> {
        const numericId = NumberUtil.ensureValidId(learningItemId, 'LearningItem ID')

        return this.prisma.videoContent.count({
            where: { learningItemId: numericId },
        })
    }
}
