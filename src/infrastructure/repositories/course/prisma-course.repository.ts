// src/infrastructure/repositories/prisma-course.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { ICourseRepository } from '../../../domain/repositories'
import type {
    CreateCourseData,
    UpdateCourseData,
    CourseFilterOptions,
    CoursePaginationOptions,
    CourseListResult,
    StudentAttendanceFilterOptions,
    StudentAttendancePaginationOptions,
    StudentAttendanceResult,
} from '../../../domain/interface'
import { Course } from '../../../domain/entities'
import { CourseMapper } from '../../mappers'
import { NumberUtil } from '../../../shared/utils'

export class PrismaCourseRepository implements ICourseRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateCourseData): Promise<Course> {
        const prismaCourse = await this.prisma.course.create({
            data: {
                title: data.title,
                subtitle: data.subtitle,
                academicYear: data.academicYear,
                grade: data.grade,
                subjectId: data.subjectId,
                description: data.description,
                priceVND: data.priceVND,
                compareAtVND: data.compareAtVND,
                visibility: data.visibility || 'DRAFT',
                teacherId: data.teacherId,
                isUpdatable: data.isUpdatable ?? true,
            },
            include: {
                subject: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return CourseMapper.toDomainCourse(prismaCourse)!
    }

    async findById(id: number): Promise<Course | null> {
        const numericId = NumberUtil.ensureValidId(id, 'Course ID')

        const prismaCourse = await this.prisma.course.findUnique({
            where: { courseId: numericId },
            include: {
                subject: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        if (!prismaCourse) return null
        return CourseMapper.toDomainCourse(prismaCourse)!
    }

    async update(id: number, data: UpdateCourseData): Promise<Course> {
        const numericId = NumberUtil.ensureValidId(id, 'Course ID')

        const prismaCourse = await this.prisma.course.update({
            where: { courseId: numericId },
            data: {
                ...data,
            },
            include: {
                subject: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return CourseMapper.toDomainCourse(prismaCourse)!
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'Course ID')

        await this.prisma.course.delete({
            where: { courseId: numericId },
        })

        return true
    }

    async findAll(): Promise<Course[]> {
        const prismaCourses = await this.prisma.course.findMany({
            include: {
                subject: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return CourseMapper.toDomainCourses(prismaCourses)
    }

    async findAllWithPagination(
        pagination: CoursePaginationOptions,
        filters?: CourseFilterOptions,
    ): Promise<CourseListResult> {
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
                { subtitle: { contains: filters.search } },
                { description: { contains: filters.search } },
            ]
        }

        if (filters?.grade !== undefined) {
            where.grade = filters.grade
        }

        if (filters?.subjectId !== undefined) {
            where.subjectId = filters.subjectId
        }

        if (filters?.visibility) {
            where.visibility = filters.visibility
        }

        if (filters?.teacherId !== undefined) {
            where.teacherId = filters.teacherId
        }

        if (filters?.academicYear) {
            where.academicYear = filters.academicYear
        }

        // Build orderBy
        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaCourses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    subject: true,
                    teacher: {
                        include: {
                            user: true,
                        },
                    },
                },
            }),
            this.prisma.course.count({ where }),
        ])

        const courses = CourseMapper.toDomainCourses(prismaCourses)
        const totalPages = Math.ceil(total / limit)

        return {
            courses,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async searchCourses(searchTerm: string, pagination?: CoursePaginationOptions): Promise<CourseListResult> {
        return this.findAllWithPagination(pagination || {}, { search: searchTerm })
    }

    async findByFilters(
        filters: CourseFilterOptions,
        pagination?: CoursePaginationOptions,
    ): Promise<CourseListResult> {
        return this.findAllWithPagination(pagination || {}, filters)
    }

    async findByGrade(grade: number): Promise<Course[]> {
        const prismaCourses = await this.prisma.course.findMany({
            where: { grade },
            include: {
                subject: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return CourseMapper.toDomainCourses(prismaCourses)
    }

    async findBySubject(subjectId: number): Promise<Course[]> {
        const prismaCourses = await this.prisma.course.findMany({
            where: { subjectId },
            include: {
                subject: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return CourseMapper.toDomainCourses(prismaCourses)
    }

    async findByTeacher(teacherId: number): Promise<Course[]> {
        const prismaCourses = await this.prisma.course.findMany({
            where: { teacherId },
            include: {
                subject: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return CourseMapper.toDomainCourses(prismaCourses)
    }

    async findByVisibility(visibility: 'DRAFT' | 'PUBLISHED' | 'PRIVATE'): Promise<Course[]> {
        const prismaCourses = await this.prisma.course.findMany({
            where: { visibility },
            include: {
                subject: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return CourseMapper.toDomainCourses(prismaCourses)
    }

    async count(filters?: CourseFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.grade !== undefined) {
            where.grade = filters.grade
        }

        if (filters?.subjectId !== undefined) {
            where.subjectId = filters.subjectId
        }

        if (filters?.visibility) {
            where.visibility = filters.visibility
        }

        if (filters?.teacherId !== undefined) {
            where.teacherId = filters.teacherId
        }

        if (filters?.academicYear) {
            where.academicYear = filters.academicYear
        }

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search } },
                { subtitle: { contains: filters.search } },
                { description: { contains: filters.search } },
            ]
        }

        return this.prisma.course.count({ where })
    }

    async countByGrade(grade: number): Promise<number> {
        return this.prisma.course.count({
            where: { grade },
        })
    }

    async countBySubject(subjectId: number): Promise<number> {
        return this.prisma.course.count({
            where: { subjectId },
        })
    }

    async countByTeacher(teacherId: number): Promise<number> {
        return this.prisma.course.count({
            where: { teacherId },
        })
    }

    /**
     * Find students with attendance records for a course within a date range
     * 
     * IMPLEMENTATION:
     * 1. Get all course classes for the course
     * 2. Get all class sessions within the date range
     * 3. Get all students who have attendance in those sessions
     * 4. For each student, get their attendance records
     * 5. Support pagination and search
     */
    async findStudentsWithAttendance(
        courseId: number,
        filters: StudentAttendanceFilterOptions,
        pagination: StudentAttendancePaginationOptions,
    ): Promise<StudentAttendanceResult> {
        const numericCourseId = NumberUtil.ensureValidId(courseId, 'Course ID')

        // 1. Build base query to get students with attendance
        const where: any = {
            attendances: {
                some: {
                    classSession: {
                        courseClass: {
                            courseId: numericCourseId,
                        },
                        sessionDate: {
                            gte: filters.fromDate,
                            lte: filters.toDate,
                        },
                    },
                },
            },
        }

        // 2. Add search filter if provided
        if (filters.search) {
            where.OR = [
                {
                    user: {
                        OR: [
                            { firstName: { contains: filters.search } },
                            { lastName: { contains: filters.search } },
                            { email: { contains: filters.search } },
                        ],
                    },
                },
                { studentPhone: { contains: filters.search } },
                { parentPhone: { contains: filters.search } },
            ]
        }

        // 3. Count total students
        const total = await this.prisma.student.count({ where })

        // 4. Calculate pagination
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const skip = (page - 1) * limit
        const totalPages = Math.ceil(total / limit)

        // 5. Fetch students with their user info
        const students = await this.prisma.student.findMany({
            where,
            include: {
                user: {
                    select: {
                        userId: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                studentId: pagination.sortOrder || 'asc',
            },
            skip,
            take: limit,
        })

        // 6. For each student, fetch their attendance records within date range
        const studentsWithAttendance = await Promise.all(
            students.map(async (student) => {
                const attendanceWhere: any = {
                    studentId: student.studentId,
                    classSession: {
                        courseClass: {
                            courseId: numericCourseId,
                        },
                        sessionDate: {
                            gte: filters.fromDate,
                            lte: filters.toDate,
                        },
                    },
                }

                // Add status filter if provided
                if (filters.status) {
                    attendanceWhere.status = filters.status
                }

                const attendances = await this.prisma.attendance.findMany({
                    where: attendanceWhere,
                    include: {
                        classSession: {
                            include: {
                                courseClass: true,
                            }
                        },
                    },
                    orderBy: {
                        markedAt: 'desc',
                    },
                })

                return {
                    student,
                    attendances,
                }
            })
        )

        return {
            students: studentsWithAttendance,
            total,
            page,
            limit,
            totalPages,
        }
    }
}
