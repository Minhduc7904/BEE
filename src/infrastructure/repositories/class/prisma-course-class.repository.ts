// src/infrastructure/repositories/prisma-course-class.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { ICourseClassRepository } from '../../../domain/repositories/course-class.repository'
import type {
    CreateCourseClassData,
    UpdateCourseClassData,
    CourseClassFilterOptions,
    CourseClassPaginationOptions,
    CourseClassListResult,
} from '../../../domain/interface/course-class/course-class.interface'
import { CourseClass } from '../../../domain/entities/course-class/course-class.entity'
import { CourseClassMapper } from '../../mappers/class/course-class.mapper'
import { NumberUtil } from '../../../shared/utils/number.util'

export class PrismaCourseClassRepository implements ICourseClassRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateCourseClassData): Promise<CourseClass> {
        const prismaClass = await this.prisma.courseClass.create({
            data: {
                courseId: data.courseId,
                className: data.className,
                startDate: data.startDate,
                endDate: data.endDate,
                room: data.room,
                instructorId: data.instructorId,
            },
            include: {
                course: true,
                instructor: { include: { user: true } },
            },
        })

        return CourseClassMapper.toDomainCourseClass(prismaClass)!
    }

    async findById(id: number): Promise<CourseClass | null> {
        const classId = NumberUtil.ensureValidId(id, 'Class ID')

        const prismaClass = await this.prisma.courseClass.findUnique({
            where: { classId },
            include: {
                course: true,
                instructor: { include: { user: true } },
            },
        })

        if (!prismaClass) return null
        return CourseClassMapper.toDomainCourseClass(prismaClass)!
    }

    async findByIds(ids: number[]): Promise<CourseClass[]> {
        const classIds = ids.map((id) => NumberUtil.ensureValidId(id, 'Class ID'))
        const prismaClasses = await this.prisma.courseClass.findMany({
            where: { classId: { in: classIds } },
            include: {
                course: true,
                instructor: { include: { user: true } },
            },
        })
        return CourseClassMapper.toDomainCourseClasses(prismaClasses)
    }

    async update(id: number, data: UpdateCourseClassData): Promise<CourseClass> {
        const classId = NumberUtil.ensureValidId(id, 'Class ID')

        const prismaClass = await this.prisma.courseClass.update({
            where: { classId },
            data: { ...data, updatedAt: new Date() },
            include: {
                course: true,
                instructor: { include: { user: true } },
            },
        })

        return CourseClassMapper.toDomainCourseClass(prismaClass)!
    }

    async delete(id: number): Promise<boolean> {
        const classId = NumberUtil.ensureValidId(id, 'Class ID')

        await this.prisma.courseClass.delete({
            where: { classId },
        })

        return true
    }

    async findAll(): Promise<CourseClass[]> {
        const prismaClasses = await this.prisma.courseClass.findMany({
            include: {
                course: true,
                instructor: { include: { user: true } },
            },
            orderBy: { startDate: 'desc' },
        })

        return CourseClassMapper.toDomainCourseClasses(prismaClasses)
    }

    async findAllWithPagination(
        pagination: CourseClassPaginationOptions,
        filters?: CourseClassFilterOptions,
    ): Promise<CourseClassListResult> {
        const page = pagination.page ?? 1
        const limit = pagination.limit ?? 10
        const sortBy = pagination.sortBy ?? 'createdAt'
        const sortOrder = pagination.sortOrder ?? 'desc'
        const skip = (page - 1) * limit

        const where: any = {}
        const andConditions: any[] = []

        /* ===================== BASIC FILTERS ===================== */

        // Ưu tiên courseIds (multi)
        if (filters?.courseIds?.length) {
            andConditions.push({
                courseId: {
                    in: filters.courseIds,
                },
            });
        }
        // Fallback single courseId
        else if (filters?.courseId !== undefined) {
            andConditions.push({
                courseId: filters.courseId,
            });
        }

        /**
         * instructorId OR course.teacherId
         */
        if (
            filters?.instructorId !== undefined ||
            filters?.teacherId !== undefined
        ) {
            const orConditions: any[] = []

            if (filters?.instructorId !== undefined) {
                orConditions.push({ instructorId: filters.instructorId })
            }

            if (filters?.teacherId !== undefined) {
                orConditions.push({
                    course: {
                        teacherId: filters.teacherId,
                    },
                })
            }

            if (orConditions.length > 0) {
                andConditions.push({ OR: orConditions })
            }
        }

        /* ===================== SEARCH ===================== */

        if (filters?.search) {
            andConditions.push({
                OR: [
                    {
                        className: {
                            contains: filters.search,
                        },
                    },
                    {
                        room: {
                            contains: filters.search,
                        },
                    },
                    {
                        course: {
                            title: {
                                contains: filters.search,
                            },
                        },
                    },
                ],
            })
        }

        /* ===================== DATE FILTERS ===================== */

        if (filters?.startDateFrom || filters?.startDateTo) {
            andConditions.push({
                startDate: {
                    ...(filters.startDateFrom && { gte: filters.startDateFrom }),
                    ...(filters.startDateTo && { lte: filters.startDateTo }),
                },
            })
        }

        if (filters?.endDateFrom || filters?.endDateTo) {
            andConditions.push({
                endDate: {
                    ...(filters.endDateFrom && { gte: filters.endDateFrom }),
                    ...(filters.endDateTo && { lte: filters.endDateTo }),
                },
            })
        }

        /* ===================== STATUS FILTER ===================== */

        const now = new Date()

        if (filters?.isActive) {
            andConditions.push({
                AND: [
                    { startDate: { lte: now } },
                    { OR: [{ endDate: null }, { endDate: { gte: now } }] },
                ],
            })
        } else if (filters?.isUpcoming) {
            andConditions.push({
                startDate: { gt: now },
            })
        } else if (filters?.isCompleted) {
            andConditions.push({
                endDate: { lt: now },
            })
        }

        /* ===================== APPLY WHERE ===================== */

        if (andConditions.length > 0) {
            where.AND = andConditions
        }

        /* ===================== ORDER ===================== */

        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        /* ===================== QUERY ===================== */

        const [prismaClasses, total] = await Promise.all([
            this.prisma.courseClass.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    course: true,
                    instructor: {
                        include: { user: true },
                    },
                },
            }),
            this.prisma.courseClass.count({ where }),
        ])

        const classes = CourseClassMapper.toDomainCourseClasses(prismaClasses)
        const totalPages = Math.ceil(total / limit)

        return {
            data: classes,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async findByCourse(courseId: number): Promise<CourseClass[]> {
        const id = NumberUtil.ensureValidId(courseId, 'Course ID')

        const prismaClasses = await this.prisma.courseClass.findMany({
            where: { courseId: id },
            include: {
                course: true,
                instructor: { include: { user: true } },
            },
            orderBy: { startDate: 'asc' },
        })

        return CourseClassMapper.toDomainCourseClasses(prismaClasses)
    }

    async findByInstructor(instructorId: number): Promise<CourseClass[]> {
        const id = NumberUtil.ensureValidId(instructorId, 'Instructor ID')

        const prismaClasses = await this.prisma.courseClass.findMany({
            where: { instructorId: id },
            include: {
                course: true,
                instructor: { include: { user: true } },
            },
            orderBy: { startDate: 'desc' },
        })

        return CourseClassMapper.toDomainCourseClasses(prismaClasses)
    }

    async count(filters?: CourseClassFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.courseId !== undefined) where.courseId = filters.courseId
        if (filters?.instructorId !== undefined) where.instructorId = filters.instructorId

        return this.prisma.courseClass.count({ where })
    }

    async countByCourse(courseId: number): Promise<number> {
        const id = NumberUtil.ensureValidId(courseId, 'Course ID')
        return this.prisma.courseClass.count({ where: { courseId: id } })
    }

    async countByInstructor(instructorId: number): Promise<number> {
        const id = NumberUtil.ensureValidId(instructorId, 'Instructor ID')
        return this.prisma.courseClass.count({ where: { instructorId: id } })
    }
}
