// src/infrastructure/repositories/prisma-homework-content.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { IHomeworkContentRepository } from '../../../domain/repositories'
import type {
    CreateHomeworkContentData,
    UpdateHomeworkContentData,
    HomeworkContentFilterOptions,
    HomeworkContentPaginationOptions,
    HomeworkContentListResult,
} from '../../../domain/interface'
import { HomeworkContent } from '../../../domain/entities'
import { HomeworkContentMapper } from '../../mappers/learning-item/homework-content.mapper'
import { NumberUtil } from '../../../shared/utils'

export class PrismaHomeworkContentRepository implements IHomeworkContentRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateHomeworkContentData): Promise<HomeworkContent> {
        const prismaHomeworkContent = await this.prisma.homeworkContent.create({
            data: {
                learningItemId: data.learningItemId,
                content: data.content,
                dueDate: data.dueDate,
                competitionId: data.competitionId,
                allowLateSubmit: data.allowLateSubmit ?? false,
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
                competition: true,
                homeworkSubmits: {
                    include: {
                        student: {
                            include: {
                                user: true,
                            },
                        },
                        grader: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return HomeworkContentMapper.toDomainHomeworkContent(prismaHomeworkContent)!
    }

    async findById(id: number): Promise<HomeworkContent | null> {
        const numericId = NumberUtil.ensureValidId(id, 'HomeworkContent ID')

        const prismaHomeworkContent = await this.prisma.homeworkContent.findUnique({
            where: { homeworkContentId: numericId },
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
                competition: true,
                homeworkSubmits: {
                    include: {
                        student: {
                            include: {
                                user: true,
                            },
                        },
                        grader: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        if (!prismaHomeworkContent) return null
        return HomeworkContentMapper.toDomainHomeworkContent(prismaHomeworkContent)!
    }

    async update(id: number, data: UpdateHomeworkContentData): Promise<HomeworkContent> {
        const numericId = NumberUtil.ensureValidId(id, 'HomeworkContent ID')

        const prismaHomeworkContent = await this.prisma.homeworkContent.update({
            where: { homeworkContentId: numericId },
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
                competition: true,
                homeworkSubmits: {
                    include: {
                        student: {
                            include: {
                                user: true,
                            },
                        },
                        grader: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return HomeworkContentMapper.toDomainHomeworkContent(prismaHomeworkContent)!
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'HomeworkContent ID')

        await this.prisma.homeworkContent.delete({
            where: { homeworkContentId: numericId },
        })

        return true
    }

    async findAll(): Promise<HomeworkContent[]> {
        const prismaHomeworkContents = await this.prisma.homeworkContent.findMany({
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
                competition: true,
                homeworkSubmits: {
                    include: {
                        student: {
                            include: {
                                user: true,
                            },
                        },
                        grader: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return HomeworkContentMapper.toDomainHomeworkContents(prismaHomeworkContents)
    }

    async findAllWithPagination(
        pagination: HomeworkContentPaginationOptions,
        filters?: HomeworkContentFilterOptions,
    ): Promise<HomeworkContentListResult> {
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

        if (filters?.competitionId) {
            where.competitionId = filters.competitionId
        }

        if (filters?.allowLateSubmit !== undefined) {
            where.allowLateSubmit = filters.allowLateSubmit
        }

        if (filters?.search) {
            where.OR = [
                { content: { contains: filters.search } },
            ]
        }

        // Execute query with pagination
        const [prismaHomeworkContents, total] = await Promise.all([
            this.prisma.homeworkContent.findMany({
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
                    competition: true,
                    homeworkSubmits: {
                        include: {
                            student: {
                                include: {
                                    user: true,
                                },
                            },
                            grader: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.homeworkContent.count({ where }),
        ])

        const homeworkContents = HomeworkContentMapper.toDomainHomeworkContents(prismaHomeworkContents)

        return {
            homeworkContents,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }

    async searchHomeworkContents(
        searchTerm: string,
        pagination?: HomeworkContentPaginationOptions,
    ): Promise<HomeworkContentListResult> {
        return this.findAllWithPagination(
            pagination || {},
            { search: searchTerm },
        )
    }

    async findByFilters(
        filters: HomeworkContentFilterOptions,
        pagination?: HomeworkContentPaginationOptions,
    ): Promise<HomeworkContentListResult> {
        return this.findAllWithPagination(pagination || {}, filters)
    }

    async findByLearningItem(learningItemId: number): Promise<HomeworkContent[]> {
        const numericId = NumberUtil.ensureValidId(learningItemId, 'LearningItem ID')

        const prismaHomeworkContents = await this.prisma.homeworkContent.findMany({
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
                competition: true,
                homeworkSubmits: {
                    include: {
                        student: {
                            include: {
                                user: true,
                            },
                        },
                        grader: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return HomeworkContentMapper.toDomainHomeworkContents(prismaHomeworkContents)
    }

    async findByCompetition(competitionId: number): Promise<HomeworkContent[]> {
        const numericId = NumberUtil.ensureValidId(competitionId, 'Competition ID')

        const prismaHomeworkContents = await this.prisma.homeworkContent.findMany({
            where: { competitionId: numericId },
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
                competition: true,
                homeworkSubmits: {
                    include: {
                        student: {
                            include: {
                                user: true,
                            },
                        },
                        grader: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })

        return HomeworkContentMapper.toDomainHomeworkContents(prismaHomeworkContents)
    }

    async count(filters?: HomeworkContentFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.learningItemId) {
            where.learningItemId = filters.learningItemId
        }

        if (filters?.competitionId) {
            where.competitionId = filters.competitionId
        }

        if (filters?.allowLateSubmit !== undefined) {
            where.allowLateSubmit = filters.allowLateSubmit
        }

        if (filters?.search) {
            where.OR = [
                { content: { contains: filters.search } },
            ]
        }

        return this.prisma.homeworkContent.count({ where })
    }

    async countByLearningItem(learningItemId: number): Promise<number> {
        const numericId = NumberUtil.ensureValidId(learningItemId, 'LearningItem ID')

        return this.prisma.homeworkContent.count({
            where: { learningItemId: numericId },
        })
    }

    async countByCompetition(competitionId: number): Promise<number> {
        const numericId = NumberUtil.ensureValidId(competitionId, 'Competition ID')

        return this.prisma.homeworkContent.count({
            where: { competitionId: numericId },
        })
    }
}
