// src/infrastructure/repositories/prisma-lesson.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { ILessonRepository } from '../../../domain/repositories'
import type {
    CreateLessonData,
    UpdateLessonData,
    LessonFilterOptions,
    LessonPaginationOptions,
    LessonListResult,
} from '../../../domain/interface'
import { Lesson } from '../../../domain/entities'
import { LessonMapper } from '../../mappers'
import { NumberUtil } from '../../../shared/utils'

export class PrismaLessonRepository implements ILessonRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateLessonData): Promise<Lesson> {
        const prismaLesson = await this.prisma.lesson.create({
            data: {
                courseId: data.courseId,
                title: data.title,
                description: data.description,
                teacherId: data.teacherId,
            },
            include: {
                course: {
                    include: {
                        subject: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return LessonMapper.toDomainLesson(prismaLesson)!
    }

    async findById(id: number): Promise<Lesson | null> {
        const numericId = NumberUtil.ensureValidId(id, 'Lesson ID')

        const prismaLesson = await this.prisma.lesson.findUnique({
            where: { lessonId: numericId },
            include: {
                course: {
                    include: {
                        subject: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        if (!prismaLesson) return null
        return LessonMapper.toDomainLesson(prismaLesson)!
    }

    async update(id: number, data: UpdateLessonData): Promise<Lesson> {
        const numericId = NumberUtil.ensureValidId(id, 'Lesson ID')

        const prismaLesson = await this.prisma.lesson.update({
            where: { lessonId: numericId },
            data: {
                ...data,
            },
            include: {
                course: {
                    include: {
                        subject: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return LessonMapper.toDomainLesson(prismaLesson)!
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'Lesson ID')

        await this.prisma.lesson.delete({
            where: { lessonId: numericId },
        })

        return true
    }

    async findAll(): Promise<Lesson[]> {
        const prismaLessons = await this.prisma.lesson.findMany({
            include: {
                course: {
                    include: {
                        subject: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return LessonMapper.toDomainLessons(prismaLessons)
    }

    async findAllWithPagination(
        pagination: LessonPaginationOptions,
        filters?: LessonFilterOptions,
    ): Promise<LessonListResult> {
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

        if (filters?.courseId !== undefined) {
            where.courseId = filters.courseId
        }

        if (filters?.teacherId !== undefined) {
            where.teacherId = filters.teacherId
        }

        // Build orderBy
        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaLessons, total] = await Promise.all([
            this.prisma.lesson.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    course: {
                        include: {
                            subject: true,
                            teacher: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                    teacher: {
                        include: {
                            user: true,
                        },
                    },
                },
            }),
            this.prisma.lesson.count({ where }),
        ])

        const lessons = LessonMapper.toDomainLessons(prismaLessons)
        const totalPages = Math.ceil(total / limit)

        return {
            lessons,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async searchLessons(searchTerm: string, pagination?: LessonPaginationOptions): Promise<LessonListResult> {
        return this.findAllWithPagination(pagination || {}, { search: searchTerm })
    }

    async findByFilters(
        filters: LessonFilterOptions,
        pagination?: LessonPaginationOptions,
    ): Promise<LessonListResult> {
        return this.findAllWithPagination(pagination || {}, filters)
    }

    async findByCourse(courseId: number): Promise<Lesson[]> {
        const numericCourseId = NumberUtil.ensureValidId(courseId, 'Course ID')

        const prismaLessons = await this.prisma.lesson.findMany({
            where: { courseId: numericCourseId },
            include: {
                course: {
                    include: {
                        subject: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return LessonMapper.toDomainLessons(prismaLessons)
    }

    async findByTeacher(teacherId: number): Promise<Lesson[]> {
        const numericTeacherId = NumberUtil.ensureValidId(teacherId, 'Teacher ID')

        const prismaLessons = await this.prisma.lesson.findMany({
            where: { teacherId: numericTeacherId },
            include: {
                course: {
                    include: {
                        subject: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return LessonMapper.toDomainLessons(prismaLessons)
    }

    async count(filters?: LessonFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search } },
                { description: { contains: filters.search } },
            ]
        }

        if (filters?.courseId !== undefined) {
            where.courseId = filters.courseId
        }

        if (filters?.teacherId !== undefined) {
            where.teacherId = filters.teacherId
        }

        return this.prisma.lesson.count({ where })
    }

    async countByCourse(courseId: number): Promise<number> {
        const numericCourseId = NumberUtil.ensureValidId(courseId, 'Course ID')

        return this.prisma.lesson.count({
            where: { courseId: numericCourseId },
        })
    }

    async countByTeacher(teacherId: number): Promise<number> {
        const numericTeacherId = NumberUtil.ensureValidId(teacherId, 'Teacher ID')

        return this.prisma.lesson.count({
            where: { teacherId: numericTeacherId },
        })
    }
}
