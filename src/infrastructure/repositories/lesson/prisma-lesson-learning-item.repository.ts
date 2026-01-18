// src/infrastructure/repositories/prisma-lesson-learning-item.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { ILessonLearningItemRepository } from '../../../domain/repositories'
import type {
    CreateLessonLearningItemData,
    LessonLearningItemFilterOptions,
    LessonLearningItemPaginationOptions,
    LessonLearningItemListResult,
} from '../../../domain/interface'
import { LessonLearningItem } from '../../../domain/entities'
import { LessonLearningItemMapper } from '../../mappers'
import { NumberUtil } from '../../../shared/utils'

export class PrismaLessonLearningItemRepository implements ILessonLearningItemRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateLessonLearningItemData): Promise<LessonLearningItem> {
        const prismaLessonLearningItem = await this.prisma.lessonLearningItem.create({
            data: {
                lessonId: data.lessonId,
                learningItemId: data.learningItemId,
                order: data.order,
            },
            include: {
                lesson: {
                    include: {
                        course: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
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

        return LessonLearningItemMapper.toDomainLessonLearningItem(prismaLessonLearningItem)!
    }

    async findByCompositeId(lessonId: number, learningItemId: number): Promise<LessonLearningItem | null> {
        const numericLessonId = NumberUtil.ensureValidId(lessonId, 'Lesson ID')
        const numericLearningItemId = NumberUtil.ensureValidId(learningItemId, 'Learning Item ID')

        const prismaLessonLearningItem = await this.prisma.lessonLearningItem.findUnique({
            where: {
                lessonId_learningItemId: {
                    lessonId: numericLessonId,
                    learningItemId: numericLearningItemId,
                },
            },
            include: {
                lesson: {
                    include: {
                        course: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
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

        if (!prismaLessonLearningItem) return null
        return LessonLearningItemMapper.toDomainLessonLearningItem(prismaLessonLearningItem)!
    }

    async delete(lessonId: number, learningItemId: number): Promise<boolean> {
        const numericLessonId = NumberUtil.ensureValidId(lessonId, 'Lesson ID')
        const numericLearningItemId = NumberUtil.ensureValidId(learningItemId, 'Learning Item ID')

        await this.prisma.lessonLearningItem.delete({
            where: {
                lessonId_learningItemId: {
                    lessonId: numericLessonId,
                    learningItemId: numericLearningItemId,
                },
            },
        })

        return true
    }

    async findAll(): Promise<LessonLearningItem[]> {
        const prismaLessonLearningItems = await this.prisma.lessonLearningItem.findMany({
            include: {
                lesson: {
                    include: {
                        course: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
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

        return LessonLearningItemMapper.toDomainLessonLearningItems(prismaLessonLearningItems)
    }

    async findAllWithPagination(
        pagination: LessonLearningItemPaginationOptions,
        filters?: LessonLearningItemFilterOptions,
    ): Promise<LessonLearningItemListResult> {
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'createdAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}

        if (filters?.lessonId !== undefined) {
            where.lessonId = filters.lessonId
        }

        if (filters?.learningItemId !== undefined) {
            where.learningItemId = filters.learningItemId
        }

        // Build orderBy
        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaLessonLearningItems, total] = await Promise.all([
            this.prisma.lessonLearningItem.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    lesson: {
                        include: {
                            course: true,
                            teacher: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
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
            this.prisma.lessonLearningItem.count({ where }),
        ])

        const lessonLearningItems = LessonLearningItemMapper.toDomainLessonLearningItems(prismaLessonLearningItems)
        const totalPages = Math.ceil(total / limit)

        return {
            lessonLearningItems,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async findByLesson(lessonId: number): Promise<LessonLearningItem[]> {
        const numericLessonId = NumberUtil.ensureValidId(lessonId, 'Lesson ID')

        const prismaLessonLearningItems = await this.prisma.lessonLearningItem.findMany({
            where: { lessonId: numericLessonId },
            include: {
                lesson: {
                    include: {
                        course: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
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

        return LessonLearningItemMapper.toDomainLessonLearningItems(prismaLessonLearningItems)
    }

    async findByLearningItem(learningItemId: number): Promise<LessonLearningItem[]> {
        const numericLearningItemId = NumberUtil.ensureValidId(learningItemId, 'Learning Item ID')

        const prismaLessonLearningItems = await this.prisma.lessonLearningItem.findMany({
            where: { learningItemId: numericLearningItemId },
            include: {
                lesson: {
                    include: {
                        course: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
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

        return LessonLearningItemMapper.toDomainLessonLearningItems(prismaLessonLearningItems)
    }

    async findByFilters(filters: LessonLearningItemFilterOptions): Promise<LessonLearningItem[]> {
        const where: any = {}

        if (filters.lessonId !== undefined) {
            where.lessonId = filters.lessonId
        }

        if (filters.learningItemId !== undefined) {
            where.learningItemId = filters.learningItemId
        }

        const prismaLessonLearningItems = await this.prisma.lessonLearningItem.findMany({
            where,
            include: {
                lesson: {
                    include: {
                        course: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
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

        return LessonLearningItemMapper.toDomainLessonLearningItems(prismaLessonLearningItems)
    }

    async count(filters?: LessonLearningItemFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.lessonId !== undefined) {
            where.lessonId = filters.lessonId
        }

        if (filters?.learningItemId !== undefined) {
            where.learningItemId = filters.learningItemId
        }

        return this.prisma.lessonLearningItem.count({ where })
    }

    async countByLesson(lessonId: number): Promise<number> {
        const numericLessonId = NumberUtil.ensureValidId(lessonId, 'Lesson ID')

        return this.prisma.lessonLearningItem.count({
            where: { lessonId: numericLessonId },
        })
    }

    async countByLearningItem(learningItemId: number): Promise<number> {
        const numericLearningItemId = NumberUtil.ensureValidId(learningItemId, 'Learning Item ID')

        return this.prisma.lessonLearningItem.count({
            where: { learningItemId: numericLearningItemId },
        })
    }

    async deleteByLesson(lessonId: number): Promise<number> {
        const numericLessonId = NumberUtil.ensureValidId(lessonId, 'Lesson ID')

        const result = await this.prisma.lessonLearningItem.deleteMany({
            where: { lessonId: numericLessonId },
        })

        return result.count
    }

    async deleteByLearningItem(learningItemId: number): Promise<number> {
        const numericLearningItemId = NumberUtil.ensureValidId(learningItemId, 'Learning Item ID')

        const result = await this.prisma.lessonLearningItem.deleteMany({
            where: { learningItemId: numericLearningItemId },
        })

        return result.count
    }

    async bulkCreate(data: CreateLessonLearningItemData[]): Promise<LessonLearningItem[]> {
        const createPromises = data.map((item) => this.create(item))
        return Promise.all(createPromises)
    }
}
