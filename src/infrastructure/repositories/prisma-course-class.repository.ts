// src/infrastructure/repositories/prisma-course-class.repository.ts
import { PrismaService } from '../../prisma/prisma.service'
import type { ICourseClassRepository } from '../../domain/repositories/course-class.repository'
import type {
    CreateCourseClassData,
    UpdateCourseClassData,
    CourseClassFilterOptions,
    CourseClassPaginationOptions,
    CourseClassListResult,
} from '../../domain/interface/course-class/course-class.interface'
import { CourseClass } from '../../domain/entities/course-class/course-class.entity'
import { CourseClassMapper } from '../mappers/course-class.mapper'
import { NumberUtil } from '../../shared/utils/number.util'

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
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'createdAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        const where: any = {}

        if (filters?.courseId !== undefined) {
            where.courseId = filters.courseId
        }

        if (filters?.instructorId !== undefined) {
            where.instructorId = filters.instructorId
        }

        if (filters?.teacherId !== undefined) {
            where.course = {
                teacherId: filters.teacherId
            }
        }

        if (filters?.search) {
            where.OR = [
                { className: { contains: filters.search } },
                { room: { contains: filters.search } },
                { course: { title: { contains: filters.search } } },
            ]
        }

        if (filters?.startDateFrom || filters?.startDateTo) {
            where.startDate = {}
            if (filters.startDateFrom) where.startDate.gte = filters.startDateFrom
            if (filters.startDateTo) where.startDate.lte = filters.startDateTo
        }

        if (filters?.endDateFrom || filters?.endDateTo) {
            where.endDate = {}
            if (filters.endDateFrom) where.endDate.gte = filters.endDateFrom
            if (filters.endDateTo) where.endDate.lte = filters.endDateTo
        }

        const now = new Date()
        if (filters?.isActive) {
            where.AND = [
                { startDate: { lte: now } },
                { OR: [{ endDate: null }, { endDate: { gte: now } }] },
            ]
        } else if (filters?.isUpcoming) {
            where.startDate = { gt: now }
        } else if (filters?.isCompleted) {
            where.endDate = { lt: now }
        }

        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaClasses, total] = await Promise.all([
            this.prisma.courseClass.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    course: true,
                    instructor: { include: { user: true } },
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
