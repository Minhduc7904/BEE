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
import { Visibility } from 'src/shared/enums'

export class PrismaLessonRepository implements ILessonRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateLessonData): Promise<Lesson> {
        // If orderInCourse not provided, get the next order number
        let orderInCourse = data.orderInCourse
        if (orderInCourse === undefined || orderInCourse === null) {
            const maxOrder = await this.prisma.lesson.aggregate({
                where: { courseId: data.courseId },
                _max: { orderInCourse: true },
            })
            orderInCourse = (maxOrder._max.orderInCourse || 0) + 1
        }

        const prismaLesson = await this.prisma.lesson.create({
            data: {
                courseId: data.courseId,
                title: data.title,
                description: data.description,
                visibility: data.visibility || 'DRAFT',
                orderInCourse,
                teacherId: data.teacherId,
                allowTrial: data.allowTrial ?? false,
                lessonChapters: data.chapterIds && data.chapterIds.length > 0
                    ? {
                        create: data.chapterIds.map((chapterId) => ({
                            chapterId,
                        })),
                    }
                    : undefined,
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
                learningItems: {
                    include: {
                        learningItem: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                lessonChapters: {
                    include: {
                        chapter: true,
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
                learningItems: {
                    include: {
                        learningItem: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                lessonChapters: {
                    include: {
                        chapter: true,
                    },
                },
            },
        })

        if (!prismaLesson) return null
        return LessonMapper.toDomainLesson(prismaLesson)!
    }

    async update(id: number, data: UpdateLessonData): Promise<Lesson> {
        const numericId = NumberUtil.ensureValidId(id, 'Lesson ID')

        // Prepare update data
        const updateData: any = {}
        if (data.title !== undefined) updateData.title = data.title
        if (data.description !== undefined) updateData.description = data.description
        if (data.visibility !== undefined) updateData.visibility = data.visibility
        if (data.orderInCourse !== undefined) updateData.orderInCourse = data.orderInCourse
        if (data.teacherId !== undefined) updateData.teacherId = data.teacherId
        if (data.allowTrial !== undefined) updateData.allowTrial = data.allowTrial

        // Handle chapter updates if provided
        if (data.chapterIds !== undefined) {
            // Delete existing chapters and create new ones
            await this.prisma.lessonChapter.deleteMany({
                where: { lessonId: numericId },
            })

            if (data.chapterIds.length > 0) {
                updateData.lessonChapters = {
                    create: data.chapterIds.map((chapterId) => ({
                        chapterId,
                    })),
                }
            }
        }

        const prismaLesson = await this.prisma.lesson.update({
            where: { lessonId: numericId },
            data: updateData,
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
                learningItems: {
                    include: {
                        learningItem: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                lessonChapters: {
                    include: {
                        chapter: true,
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
                learningItems: {
                    include: {
                        learningItem: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                lessonChapters: {
                    include: {
                        chapter: true,
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
        // console.log('findAllWithPagination - where:', where, 'orderBy:', orderBy, 'skip:', skip, 'limit:', limit);
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
                    learningItems: {
                        include: {
                            learningItem: true,
                        },
                        orderBy: {
                            order: 'asc',
                        },
                    },
                    lessonChapters: {
                        include: {
                            chapter: true,
                        },
                    },
                },
            }),
            this.prisma.lesson.count({ where }),
        ])
        // console.log('prismaLessons:', prismaLessons);
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
                learningItems: {
                    include: {
                        learningItem: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                lessonChapters: {
                    include: {
                        chapter: true,
                    },
                },
            },
        })

        return LessonMapper.toDomainLessons(prismaLessons)
    }

    async findByCourseForStudent(courseId: number): Promise<Lesson[]> {
        const numericCourseId = NumberUtil.ensureValidId(courseId, 'Course ID')

        const prismaLessons = await this.prisma.lesson.findMany({
            where: { 
                courseId: numericCourseId,
                visibility: { not: Visibility.DRAFT }, // Loại trừ lesson DRAFT
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
                learningItems: {
                    include: {
                        learningItem: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                lessonChapters: {
                    include: {
                        chapter: true,
                    },
                },
            },
            orderBy: {
                orderInCourse: 'asc',
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
                learningItems: {
                    include: {
                        learningItem: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                lessonChapters: {
                    include: {
                        chapter: true,
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
