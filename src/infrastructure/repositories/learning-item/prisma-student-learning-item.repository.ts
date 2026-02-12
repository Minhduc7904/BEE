// src/infrastructure/repositories/learning-item/prisma-student-learning-item.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { IStudentLearningItemRepository } from '../../../domain/repositories/student-learning-item.repository'
import type {
    CreateStudentLearningItemData,
    UpdateStudentLearningItemData,
    StudentLearningItemFilterOptions,
    StudentLearningItemPaginationOptions,
    StudentLearningItemListResult,
} from '../../../domain/interface/student-learning-item/student-learning-item.interface'
import { StudentLearningItem } from '../../../domain/entities'
import { StudentLearningItemMapper } from '../../mappers/learning-item/student-learning-item.mapper'
import { NumberUtil } from '../../../shared/utils'

export class PrismaStudentLearningItemRepository implements IStudentLearningItemRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateStudentLearningItemData): Promise<StudentLearningItem> {
        const prismaStudentLearningItem = await this.prisma.studentLearningItem.create({
            data: {
                studentId: data.studentId,
                learningItemId: data.learningItemId,
                isLearned: data.isLearned ?? false,
                learnedAt: data.learnedAt,
            },
            include: {
                student: {
                    include: { user: true },
                },
                learningItem: true,
            },
        })

        return StudentLearningItemMapper.toDomainStudentLearningItem(prismaStudentLearningItem)!
    }

    async createBulk(data: CreateStudentLearningItemData[]): Promise<StudentLearningItem[]> {
        if (!data.length) return []

        await this.prisma.studentLearningItem.createMany({
            data: data.map((item) => ({
                studentId: item.studentId,
                learningItemId: item.learningItemId,
                isLearned: item.isLearned ?? false,
                learnedAt: item.learnedAt,
            })),
            skipDuplicates: true,
        })

        const created = await this.prisma.studentLearningItem.findMany({
            where: {
                studentId: data[0].studentId,
                learningItemId: {
                    in: data.map((item) => item.learningItemId),
                },
            },
            include: {
                student: {
                    include: { user: true },
                },
                learningItem: true,
            },
        })

        return StudentLearningItemMapper.toDomainStudentLearningItems(created)
    }

    async findByCompositeId(
        studentId: number,
        learningItemId: number,
    ): Promise<StudentLearningItem | null> {
        const numericStudentId = NumberUtil.ensureValidId(studentId, 'Student ID')
        const numericLearningItemId = NumberUtil.ensureValidId(learningItemId, 'Learning Item ID')

        const prismaStudentLearningItem = await this.prisma.studentLearningItem.findUnique({
            where: {
                studentId_learningItemId: {
                    studentId: numericStudentId,
                    learningItemId: numericLearningItemId,
                },
            },
            include: {
                student: {
                    include: { user: true },
                },
                learningItem: true,
            },
        })

        if (!prismaStudentLearningItem) return null
        return StudentLearningItemMapper.toDomainStudentLearningItem(prismaStudentLearningItem)!
    }

    async update(
        studentId: number,
        learningItemId: number,
        data: UpdateStudentLearningItemData,
    ): Promise<StudentLearningItem> {
        const numericStudentId = NumberUtil.ensureValidId(studentId, 'Student ID')
        const numericLearningItemId = NumberUtil.ensureValidId(learningItemId, 'Learning Item ID')

        const prismaStudentLearningItem = await this.prisma.studentLearningItem.update({
            where: {
                studentId_learningItemId: {
                    studentId: numericStudentId,
                    learningItemId: numericLearningItemId,
                },
            },
            data: {
                isLearned: data.isLearned,
                learnedAt: data.learnedAt,
            },
            include: {
                student: {
                    include: { user: true },
                },
                learningItem: true,
            },
        })

        return StudentLearningItemMapper.toDomainStudentLearningItem(prismaStudentLearningItem)!
    }

    async delete(studentId: number, learningItemId: number): Promise<boolean> {
        const numericStudentId = NumberUtil.ensureValidId(studentId, 'Student ID')
        const numericLearningItemId = NumberUtil.ensureValidId(learningItemId, 'Learning Item ID')

        await this.prisma.studentLearningItem.delete({
            where: {
                studentId_learningItemId: {
                    studentId: numericStudentId,
                    learningItemId: numericLearningItemId,
                },
            },
        })

        return true
    }

    async findAll(): Promise<StudentLearningItem[]> {
        const prismaStudentLearningItems = await this.prisma.studentLearningItem.findMany({
            include: {
                student: {
                    include: { user: true },
                },
                learningItem: true,
            },
        })

        return StudentLearningItemMapper.toDomainStudentLearningItems(prismaStudentLearningItems)
    }

    async findAllWithPagination(
        pagination: StudentLearningItemPaginationOptions,
        filters?: StudentLearningItemFilterOptions,
    ): Promise<StudentLearningItemListResult> {
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const skip = (page - 1) * limit

        const where: any = {}

        if (filters?.studentId !== undefined) {
            where.studentId = filters.studentId
        }

        if (filters?.learningItemId !== undefined) {
            where.learningItemId = filters.learningItemId
        }

        if (filters?.isLearned !== undefined) {
            where.isLearned = filters.isLearned
        }

        if (filters?.learningItemIds && filters.learningItemIds.length > 0) {
            where.learningItemId = {
                in: filters.learningItemIds,
            }
        }

        const [prismaStudentLearningItems, total] = await Promise.all([
            this.prisma.studentLearningItem.findMany({
                where,
                skip,
                take: limit,
                include: {
                    student: {
                        include: { user: true },
                    },
                    learningItem: true,
                },
            }),
            this.prisma.studentLearningItem.count({ where }),
        ])

        const data = StudentLearningItemMapper.toDomainStudentLearningItems(prismaStudentLearningItems)

        return { data, total }
    }

    async findByStudent(studentId: number): Promise<StudentLearningItem[]> {
        const numericStudentId = NumberUtil.ensureValidId(studentId, 'Student ID')

        const prismaStudentLearningItems = await this.prisma.studentLearningItem.findMany({
            where: { studentId: numericStudentId },
            include: {
                student: {
                    include: { user: true },
                },
                learningItem: true,
            },
        })

        return StudentLearningItemMapper.toDomainStudentLearningItems(prismaStudentLearningItems)
    }

    async findByLearningItem(learningItemId: number): Promise<StudentLearningItem[]> {
        const numericLearningItemId = NumberUtil.ensureValidId(learningItemId, 'Learning Item ID')

        const prismaStudentLearningItems = await this.prisma.studentLearningItem.findMany({
            where: { learningItemId: numericLearningItemId },
            include: {
                student: {
                    include: { user: true },
                },
                learningItem: true,
            },
        })

        return StudentLearningItemMapper.toDomainStudentLearningItems(prismaStudentLearningItems)
    }

    async findByStudentAndItems(
        studentId: number,
        learningItemIds: number[],
    ): Promise<StudentLearningItem[]> {
        const numericStudentId = NumberUtil.ensureValidId(studentId, 'Student ID')

        if (!learningItemIds || learningItemIds.length === 0) {
            return []
        }

        const prismaStudentLearningItems = await this.prisma.studentLearningItem.findMany({
            where: {
                studentId: numericStudentId,
                learningItemId: {
                    in: learningItemIds,
                },
            },
            include: {
                student: {
                    include: { user: true },
                },
                learningItem: true,
            },
        })

        return StudentLearningItemMapper.toDomainStudentLearningItems(prismaStudentLearningItems)
    }

    async findByFilters(filters: StudentLearningItemFilterOptions): Promise<StudentLearningItem[]> {
        const where: any = {}

        if (filters.studentId !== undefined) {
            where.studentId = filters.studentId
        }

        if (filters.learningItemId !== undefined) {
            where.learningItemId = filters.learningItemId
        }

        if (filters.isLearned !== undefined) {
            where.isLearned = filters.isLearned
        }

        if (filters.learningItemIds && filters.learningItemIds.length > 0) {
            where.learningItemId = {
                in: filters.learningItemIds,
            }
        }

        const prismaStudentLearningItems = await this.prisma.studentLearningItem.findMany({
            where,
            include: {
                student: {
                    include: { user: true },
                },
                learningItem: true,
            },
        })

        return StudentLearningItemMapper.toDomainStudentLearningItems(prismaStudentLearningItems)
    }

    async exists(studentId: number, learningItemId: number): Promise<boolean> {
        const numericStudentId = NumberUtil.ensureValidId(studentId, 'Student ID')
        const numericLearningItemId = NumberUtil.ensureValidId(learningItemId, 'Learning Item ID')

        const count = await this.prisma.studentLearningItem.count({
            where: {
                studentId: numericStudentId,
                learningItemId: numericLearningItemId,
            },
        })

        return count > 0
    }

    async count(filters?: StudentLearningItemFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.studentId !== undefined) {
            where.studentId = filters.studentId
        }

        if (filters?.learningItemId !== undefined) {
            where.learningItemId = filters.learningItemId
        }

        if (filters?.isLearned !== undefined) {
            where.isLearned = filters.isLearned
        }

        if (filters?.learningItemIds && filters.learningItemIds.length > 0) {
            where.learningItemId = {
                in: filters.learningItemIds,
            }
        }

        return this.prisma.studentLearningItem.count({ where })
    }

    async countByStudent(studentId: number): Promise<number> {
        const numericStudentId = NumberUtil.ensureValidId(studentId, 'Student ID')

        return this.prisma.studentLearningItem.count({
            where: { studentId: numericStudentId },
        })
    }

    async countByLearningItem(learningItemId: number): Promise<number> {
        const numericLearningItemId = NumberUtil.ensureValidId(learningItemId, 'Learning Item ID')

        return this.prisma.studentLearningItem.count({
            where: { learningItemId: numericLearningItemId },
        })
    }

    async countLearnedByStudent(studentId: number): Promise<number> {
        const numericStudentId = NumberUtil.ensureValidId(studentId, 'Student ID')

        return this.prisma.studentLearningItem.count({
            where: {
                studentId: numericStudentId,
                isLearned: true,
            },
        })
    }
}
