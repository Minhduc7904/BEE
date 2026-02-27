// src/infrastructure/repositories/prisma-homework-submit.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { IHomeworkSubmitRepository } from '../../../domain/repositories'
import type {
    CreateHomeworkSubmitData,
    UpdateHomeworkSubmitData,
    GradeHomeworkSubmitData,
    HomeworkSubmitFilterOptions,
    HomeworkSubmitPaginationOptions,
    HomeworkSubmitListResult,
} from '../../../domain/interface'
import { HomeworkSubmit } from '../../../domain/entities'
import { HomeworkSubmitMapper } from '../../mappers/learning-item/homework-submit.mapper'
import { NumberUtil } from '../../../shared/utils'

export class PrismaHomeworkSubmitRepository implements IHomeworkSubmitRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateHomeworkSubmitData): Promise<HomeworkSubmit> {
        const homeworkContent = NumberUtil.ensureValidId(data.homeworkContentId, 'HomeworkContent ID')
        const prismaHomeworkSubmit = await this.prisma.homeworkSubmit.create({
            data: {
                homeworkContentId: data.homeworkContentId,
                studentId: data.studentId,
                content: data.content,
            },
            include: {
                homeworkContent: {
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
                    },
                },
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
        })

        return HomeworkSubmitMapper.toDomainHomeworkSubmit(prismaHomeworkSubmit)!
    }

    async findById(id: number): Promise<HomeworkSubmit | null> {
        const numericId = NumberUtil.ensureValidId(id, 'HomeworkSubmit ID')

        const prismaHomeworkSubmit = await this.prisma.homeworkSubmit.findUnique({
            where: { homeworkSubmitId: numericId },
            include: {
                homeworkContent: {
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
                    },
                },
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
        })

        if (!prismaHomeworkSubmit) return null
        return HomeworkSubmitMapper.toDomainHomeworkSubmit(prismaHomeworkSubmit)!
    }

    async update(id: number, data: UpdateHomeworkSubmitData): Promise<HomeworkSubmit> {
        const numericId = NumberUtil.ensureValidId(id, 'HomeworkSubmit ID')

        const prismaHomeworkSubmit = await this.prisma.homeworkSubmit.update({
            where: { homeworkSubmitId: numericId },
            data: {
                ...data,
            },
            include: {
                homeworkContent: {
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
                    },
                },
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
        })

        return HomeworkSubmitMapper.toDomainHomeworkSubmit(prismaHomeworkSubmit)!
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'HomeworkSubmit ID')

        await this.prisma.homeworkSubmit.delete({
            where: { homeworkSubmitId: numericId },
        })

        return true
    }

    async findAll(): Promise<HomeworkSubmit[]> {
        const prismaHomeworkSubmits = await this.prisma.homeworkSubmit.findMany({
            include: {
                homeworkContent: {
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
                    },
                },
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
        })

        return HomeworkSubmitMapper.toDomainHomeworkSubmits(prismaHomeworkSubmits)
    }

    async findAllWithPagination(
        pagination: HomeworkSubmitPaginationOptions,
        filters?: HomeworkSubmitFilterOptions,
    ): Promise<HomeworkSubmitListResult> {
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'submitAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}

        if (filters?.homeworkContentId) {
            where.homeworkContentId = filters.homeworkContentId
        }

        if (filters?.studentId) {
            where.studentId = filters.studentId
        }

        if (filters?.graderId) {
            where.graderId = filters.graderId
        }

        if (filters?.isGraded !== undefined) {
            if (filters.isGraded) {
                where.points = { not: null }
            } else {
                where.points = null
            }
        }

        if (filters?.search) {
            where.OR = [
                { content: { contains: filters.search } },
                { feedback: { contains: filters.search } },
            ]
        }

        // Execute query with pagination
        const [prismaHomeworkSubmits, total] = await Promise.all([
            this.prisma.homeworkSubmit.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    homeworkContent: {
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
                        },
                    },
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
            }),
            this.prisma.homeworkSubmit.count({ where }),
        ])

        const homeworkSubmits = HomeworkSubmitMapper.toDomainHomeworkSubmits(prismaHomeworkSubmits)

        return {
            homeworkSubmits,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }

    async searchHomeworkSubmits(
        searchTerm: string,
        pagination?: HomeworkSubmitPaginationOptions,
    ): Promise<HomeworkSubmitListResult> {
        return this.findAllWithPagination(
            pagination || {},
            { search: searchTerm },
        )
    }

    async findByFilters(
        filters: HomeworkSubmitFilterOptions,
        pagination?: HomeworkSubmitPaginationOptions,
    ): Promise<HomeworkSubmitListResult> {
        return this.findAllWithPagination(pagination || {}, filters)
    }

    async findByHomeworkContent(homeworkContentId: number): Promise<HomeworkSubmit[]> {
        const numericId = NumberUtil.ensureValidId(homeworkContentId, 'HomeworkContent ID')

        const prismaHomeworkSubmits = await this.prisma.homeworkSubmit.findMany({
            where: { homeworkContentId: numericId },
            include: {
                homeworkContent: {
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
                    },
                },
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
            orderBy: { submitAt: 'desc' },
        })

        return HomeworkSubmitMapper.toDomainHomeworkSubmits(prismaHomeworkSubmits)
    }

    async findManyByContentAndStudents(homeworkContentId: number, studentIds: number[]): Promise<HomeworkSubmit[]> {
        const numericId = NumberUtil.ensureValidId(homeworkContentId, 'HomeworkContent ID')
        if (studentIds.length === 0) return []

        const prismaHomeworkSubmits = await this.prisma.homeworkSubmit.findMany({
            where: {
                homeworkContentId: numericId,
                studentId: { in: studentIds },
            },
            include: {
                homeworkContent: {
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
                    },
                },
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
            orderBy: { submitAt: 'desc' },
        })

        return HomeworkSubmitMapper.toDomainHomeworkSubmits(prismaHomeworkSubmits)
    }

    async findByStudent(studentId: number): Promise<HomeworkSubmit[]> {
        const numericId = NumberUtil.ensureValidId(studentId, 'Student ID')

        const prismaHomeworkSubmits = await this.prisma.homeworkSubmit.findMany({
            where: { studentId: numericId },
            include: {
                homeworkContent: {
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
                    },
                },
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
            orderBy: { submitAt: 'desc' },
        })

        return HomeworkSubmitMapper.toDomainHomeworkSubmits(prismaHomeworkSubmits)
    }

    async findByGrader(graderId: number): Promise<HomeworkSubmit[]> {
        const numericId = NumberUtil.ensureValidId(graderId, 'Grader ID')

        const prismaHomeworkSubmits = await this.prisma.homeworkSubmit.findMany({
            where: { graderId: numericId },
            include: {
                homeworkContent: {
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
                    },
                },
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
            orderBy: { gradedAt: 'desc' },
        })

        return HomeworkSubmitMapper.toDomainHomeworkSubmits(prismaHomeworkSubmits)
    }

    async findByHomeworkAndStudent(
        homeworkContentId: number,
        studentId: number,
    ): Promise<HomeworkSubmit | null> {
        const numericHomeworkId = NumberUtil.ensureValidId(homeworkContentId, 'HomeworkContent ID')
        const numericStudentId = NumberUtil.ensureValidId(studentId, 'Student ID')

        const prismaHomeworkSubmit = await this.prisma.homeworkSubmit.findUnique({
            where: {
                homeworkContentId_studentId: {
                    homeworkContentId: numericHomeworkId,
                    studentId: numericStudentId,
                },
            },
            include: {
                homeworkContent: {
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
                    },
                },
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
        })

        if (!prismaHomeworkSubmit) return null
        return HomeworkSubmitMapper.toDomainHomeworkSubmit(prismaHomeworkSubmit)!
    }

    async grade(id: number, data: GradeHomeworkSubmitData): Promise<HomeworkSubmit> {
        const numericId = NumberUtil.ensureValidId(id, 'HomeworkSubmit ID')

        const prismaHomeworkSubmit = await this.prisma.homeworkSubmit.update({
            where: { homeworkSubmitId: numericId },
            data: {
                points: data.points,
                graderId: data.graderId,
                feedback: data.feedback,
                gradedAt: new Date(),
            },
            include: {
                homeworkContent: {
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
                    },
                },
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
        })

        return HomeworkSubmitMapper.toDomainHomeworkSubmit(prismaHomeworkSubmit)!
    }

    async count(filters?: HomeworkSubmitFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.homeworkContentId) {
            where.homeworkContentId = filters.homeworkContentId
        }

        if (filters?.studentId) {
            where.studentId = filters.studentId
        }

        if (filters?.graderId) {
            where.graderId = filters.graderId
        }

        if (filters?.isGraded !== undefined) {
            if (filters.isGraded) {
                where.points = { not: null }
            } else {
                where.points = null
            }
        }

        if (filters?.search) {
            where.OR = [
                { content: { contains: filters.search } },
                { feedback: { contains: filters.search } },
            ]
        }

        return this.prisma.homeworkSubmit.count({ where })
    }

    async countByHomeworkContent(homeworkContentId: number): Promise<number> {
        const numericId = NumberUtil.ensureValidId(homeworkContentId, 'HomeworkContent ID')

        return this.prisma.homeworkSubmit.count({
            where: { homeworkContentId: numericId },
        })
    }

    async countByStudent(studentId: number): Promise<number> {
        const numericId = NumberUtil.ensureValidId(studentId, 'Student ID')

        return this.prisma.homeworkSubmit.count({
            where: { studentId: numericId },
        })
    }

    async countGradedSubmits(homeworkContentId?: number): Promise<number> {
        const where: any = {
            points: { not: null },
        }

        if (homeworkContentId) {
            const numericId = NumberUtil.ensureValidId(homeworkContentId, 'HomeworkContent ID')
            where.homeworkContentId = numericId
        }

        return this.prisma.homeworkSubmit.count({ where })
    }

    async countUngradedSubmits(homeworkContentId?: number): Promise<number> {
        const where: any = {
            points: null,
        }

        if (homeworkContentId) {
            const numericId = NumberUtil.ensureValidId(homeworkContentId, 'HomeworkContent ID')
            where.homeworkContentId = numericId
        }

        return this.prisma.homeworkSubmit.count({ where })
    }
}
