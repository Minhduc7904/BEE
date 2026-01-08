// src/infrastructure/repositories/prisma-course-enrollment.repository.ts
import { PrismaService } from '../../prisma/prisma.service'
import type { ICourseEnrollmentRepository } from '../../domain/repositories/course-enrollment.repository'
import type {
    CreateCourseEnrollmentData,
    UpdateCourseEnrollmentData,
    CourseEnrollmentFilterOptions,
    CourseEnrollmentPaginationOptions,
    CourseEnrollmentListResult,
} from '../../domain/interface/course-enrollment/course-enrollment.interface'
import { CourseEnrollment } from '../../domain/entities/course-enrollment/course-enrollment.entity'
import { CourseEnrollmentMapper } from '../mappers/course-enrollment.mapper'
import { NumberUtil } from '../../shared/utils/number.util'

export class PrismaCourseEnrollmentRepository implements ICourseEnrollmentRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateCourseEnrollmentData): Promise<CourseEnrollment> {
        const prismaEnrollment = await this.prisma.courseEnrollment.create({
            data: {
                courseId: data.courseId,
                studentId: data.studentId,
                status: data.status,
            },
            include: {
                course: true,
                student: {
                    include: { user: true },
                },
            },
        })

        return CourseEnrollmentMapper.toDomainCourseEnrollment(prismaEnrollment)!
    }

    async findById(id: number): Promise<CourseEnrollment | null> {
        const enrollmentId = NumberUtil.ensureValidId(id, 'Enrollment ID')

        const prismaEnrollment = await this.prisma.courseEnrollment.findUnique({
            where: { enrollmentId },
            include: {
                course: true,
                student: {
                    include: { user: true },
                },
            },
        })

        if (!prismaEnrollment) return null
        return CourseEnrollmentMapper.toDomainCourseEnrollment(prismaEnrollment)!
    }

    async update(id: number, data: UpdateCourseEnrollmentData): Promise<CourseEnrollment> {
        const enrollmentId = NumberUtil.ensureValidId(id, 'Enrollment ID')

        const prismaEnrollment = await this.prisma.courseEnrollment.update({
            where: { enrollmentId },
            data: {
                ...data,
            },
            include: {
                course: true,
                student: {
                    include: { user: true },
                },
            },
        })

        return CourseEnrollmentMapper.toDomainCourseEnrollment(prismaEnrollment)!
    }

    async delete(id: number): Promise<boolean> {
        const enrollmentId = NumberUtil.ensureValidId(id, 'Enrollment ID')

        await this.prisma.courseEnrollment.delete({
            where: { enrollmentId },
        })

        return true
    }

    async findAll(): Promise<CourseEnrollment[]> {
        const prismaEnrollments = await this.prisma.courseEnrollment.findMany({
            include: {
                course: true,
                student: {
                    include: { user: true },
                },
            },
            orderBy: { enrolledAt: 'desc' },
        })

        return CourseEnrollmentMapper.toDomainCourseEnrollments(prismaEnrollments)
    }

    async findAllWithPagination(
        pagination: CourseEnrollmentPaginationOptions,
        filters?: CourseEnrollmentFilterOptions,
    ): Promise<CourseEnrollmentListResult> {
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'enrolledAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        const where: any = {}

        if (filters?.courseId !== undefined) {
            where.courseId = filters.courseId
        }

        if (filters?.studentId !== undefined) {
            where.studentId = filters.studentId
        }

        if (filters?.status) {
            where.status = filters.status
        }

        if (filters?.search) {
            where.OR = [
                { course: { title: { contains: filters.search, mode: 'insensitive' } } },
                { student: { user: { firstName: { contains: filters.search, mode: 'insensitive' } } } },
                { student: { user: { lastName: { contains: filters.search, mode: 'insensitive' } } } },
            ]
        }

        if (filters?.enrolledAtFrom || filters?.enrolledAtTo) {
            where.enrolledAt = {}
            if (filters.enrolledAtFrom) {
                where.enrolledAt.gte = filters.enrolledAtFrom
            }
            if (filters.enrolledAtTo) {
                where.enrolledAt.lte = filters.enrolledAtTo
            }
        }

        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaEnrollments, total] = await Promise.all([
            this.prisma.courseEnrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    course: true,
                    student: {
                        include: { user: true },
                    },
                },
            }),
            this.prisma.courseEnrollment.count({ where }),
        ])

        const enrollments = CourseEnrollmentMapper.toDomainCourseEnrollments(prismaEnrollments)
        const totalPages = Math.ceil(total / limit)

        return {
            data: enrollments,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async findByCourse(courseId: number): Promise<CourseEnrollment[]> {
        const id = NumberUtil.ensureValidId(courseId, 'Course ID')

        const prismaEnrollments = await this.prisma.courseEnrollment.findMany({
            where: { courseId: id },
            include: {
                course: true,
                student: {
                    include: { user: true },
                },
            },
            orderBy: { enrolledAt: 'desc' },
        })

        return CourseEnrollmentMapper.toDomainCourseEnrollments(prismaEnrollments)
    }

    async findByStudent(studentId: number): Promise<CourseEnrollment[]> {
        const id = NumberUtil.ensureValidId(studentId, 'Student ID')

        const prismaEnrollments = await this.prisma.courseEnrollment.findMany({
            where: { studentId: id },
            include: {
                course: true,
                student: {
                    include: { user: true },
                },
            },
            orderBy: { enrolledAt: 'desc' },
        })

        return CourseEnrollmentMapper.toDomainCourseEnrollments(prismaEnrollments)
    }

    async findByCourseAndStudent(courseId: number, studentId: number): Promise<CourseEnrollment | null> {
        const cId = NumberUtil.ensureValidId(courseId, 'Course ID')
        const sId = NumberUtil.ensureValidId(studentId, 'Student ID')

        const prismaEnrollment = await this.prisma.courseEnrollment.findFirst({
            where: { courseId: cId, studentId: sId },
            include: {
                course: true,
                student: {
                    include: { user: true },
                },
            },
        })

        if (!prismaEnrollment) return null
        return CourseEnrollmentMapper.toDomainCourseEnrollment(prismaEnrollment)!
    }

    async exists(courseId: number, studentId: number): Promise<boolean> {
        const cId = NumberUtil.ensureValidId(courseId, 'Course ID')
        const sId = NumberUtil.ensureValidId(studentId, 'Student ID')

        const count = await this.prisma.courseEnrollment.count({
            where: { courseId: cId, studentId: sId },
        })

        return count > 0
    }

    async count(filters?: CourseEnrollmentFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.courseId !== undefined) {
            where.courseId = filters.courseId
        }

        if (filters?.studentId !== undefined) {
            where.studentId = filters.studentId
        }

        if (filters?.status) {
            where.status = filters.status
        }

        return this.prisma.courseEnrollment.count({ where })
    }

    async countByCourse(courseId: number): Promise<number> {
        const id = NumberUtil.ensureValidId(courseId, 'Course ID')
        return this.prisma.courseEnrollment.count({ where: { courseId: id } })
    }

    async countByStudent(studentId: number): Promise<number> {
        const id = NumberUtil.ensureValidId(studentId, 'Student ID')
        return this.prisma.courseEnrollment.count({ where: { studentId: id } })
    }

    async countByStatus(status: string): Promise<number> {
        return this.prisma.courseEnrollment.count({ where: { status } })
    }
}
