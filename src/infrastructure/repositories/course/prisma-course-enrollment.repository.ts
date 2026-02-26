// src/infrastructure/repositories/prisma-course-enrollment.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { ICourseEnrollmentRepository } from '../../../domain/repositories/course-enrollment.repository'
import type {
    CreateCourseEnrollmentData,
    UpdateCourseEnrollmentData,
    CourseEnrollmentFilterOptions,
    CourseEnrollmentPaginationOptions,
    CourseEnrollmentListResult,
} from '../../../domain/interface/course-enrollment/course-enrollment.interface'
import { CourseEnrollment } from '../../../domain/entities/course-enrollment/course-enrollment.entity'
import { CourseEnrollmentMapper } from '../../mappers/course/course-enrollment.mapper'
import { NumberUtil } from '../../../shared/utils/number.util'
import { TextSearchUtil } from '../../../shared/utils/text-search.util'

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

    async createBulk(
        data: CreateCourseEnrollmentData[]
    ): Promise<CourseEnrollment[]> {

        if (!data.length) return [];

        // 1️⃣ Create many (ghi DB)
        await this.prisma.courseEnrollment.createMany({
            data: data.map(e => ({
                courseId: e.courseId,
                studentId: e.studentId,
                status: e.status,
            })),
            skipDuplicates: true,
        });

        // 2️⃣ Query lại đúng record vừa tạo
        const createdEnrollments = await this.prisma.courseEnrollment.findMany({
            where: {
                studentId: data[0].studentId,
                courseId: {
                    in: data.map(e => e.courseId),
                },
            },
            include: {
                course: true,
                student: {
                    include: { user: true },
                },
            },
        });

        return CourseEnrollmentMapper.toDomainCourseEnrollments(createdEnrollments);
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

        if (filters?.search) {
            return this.findWithRawQuery(pagination, filters)
        }

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

        if (filters?.enrolledAtFrom || filters?.enrolledAtTo) {
            where.enrolledAt = {}
            if (filters.enrolledAtFrom) {
                where.enrolledAt.gte = filters.enrolledAtFrom
            }
            if (filters.enrolledAtTo) {
                where.enrolledAt.lte = filters.enrolledAtTo
            }
        }

        if (filters?.courseVisibility) {
            where.course = {
                ...where.course,
                visibility: filters.courseVisibility,
            }
        }

        if (filters?.excludeVisibilities && filters.excludeVisibilities.length > 0) {
            where.course = {
                ...where.course,
                visibility: {
                    notIn: filters.excludeVisibilities,
                },
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
                    course: {
                        include: {
                            subject: true,
                            teacher: {
                                include: {
                                    user: true,
                                },
                            },
                            lessons: {
                                include: {
                                    learningItems: true,
                                },
                            },
                        },
                    },
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

    private buildRemoveAccentsSQL(columnName: string): string {
        const replacements = [
            ['à', 'a'], ['á', 'a'], ['ạ', 'a'], ['ả', 'a'], ['ã', 'a'],
            ['â', 'a'], ['ầ', 'a'], ['ấ', 'a'], ['ậ', 'a'], ['ẩ', 'a'], ['ẫ', 'a'],
            ['ă', 'a'], ['ằ', 'a'], ['ắ', 'a'], ['ặ', 'a'], ['ẳ', 'a'], ['ẵ', 'a'],
            ['è', 'e'], ['é', 'e'], ['ẹ', 'e'], ['ẻ', 'e'], ['ẽ', 'e'],
            ['ê', 'e'], ['ề', 'e'], ['ế', 'e'], ['ệ', 'e'], ['ể', 'e'], ['ễ', 'e'],
            ['ì', 'i'], ['í', 'i'], ['ị', 'i'], ['ỉ', 'i'], ['ĩ', 'i'],
            ['ò', 'o'], ['ó', 'o'], ['ọ', 'o'], ['ỏ', 'o'], ['õ', 'o'],
            ['ô', 'o'], ['ồ', 'o'], ['ố', 'o'], ['ộ', 'o'], ['ổ', 'o'], ['ỗ', 'o'],
            ['ơ', 'o'], ['ờ', 'o'], ['ớ', 'o'], ['ợ', 'o'], ['ở', 'o'], ['ỡ', 'o'],
            ['ù', 'u'], ['ú', 'u'], ['ụ', 'u'], ['ủ', 'u'], ['ũ', 'u'],
            ['ư', 'u'], ['ừ', 'u'], ['ứ', 'u'], ['ự', 'u'], ['ử', 'u'], ['ữ', 'u'],
            ['ỳ', 'y'], ['ý', 'y'], ['ỵ', 'y'], ['ỷ', 'y'], ['ỹ', 'y'],
            ['đ', 'd'],
            ['À', 'A'], ['Á', 'A'], ['Ạ', 'A'], ['Ả', 'A'], ['Ã', 'A'],
            ['Â', 'A'], ['Ầ', 'A'], ['Ấ', 'A'], ['Ậ', 'A'], ['Ẩ', 'A'], ['Ẫ', 'A'],
            ['Ă', 'A'], ['Ằ', 'A'], ['Ắ', 'A'], ['Ặ', 'A'], ['Ẳ', 'A'], ['Ẵ', 'A'],
            ['È', 'E'], ['É', 'E'], ['Ẹ', 'E'], ['Ẻ', 'E'], ['Ẽ', 'E'],
            ['Ê', 'E'], ['Ề', 'E'], ['Ế', 'E'], ['Ệ', 'E'], ['Ể', 'E'], ['Ễ', 'E'],
            ['Ì', 'I'], ['Í', 'I'], ['Ị', 'I'], ['Ỉ', 'I'], ['Ĩ', 'I'],
            ['Ò', 'O'], ['Ó', 'O'], ['Ọ', 'O'], ['Ỏ', 'O'], ['Õ', 'O'],
            ['Ô', 'O'], ['Ồ', 'O'], ['Ố', 'O'], ['Ộ', 'O'], ['Ổ', 'O'], ['Ỗ', 'O'],
            ['Ơ', 'O'], ['Ờ', 'O'], ['Ớ', 'O'], ['Ợ', 'O'], ['Ở', 'O'], ['Ỡ', 'O'],
            ['Ù', 'U'], ['Ú', 'U'], ['Ụ', 'U'], ['Ủ', 'U'], ['Ũ', 'U'],
            ['Ư', 'U'], ['Ừ', 'U'], ['Ứ', 'U'], ['Ự', 'U'], ['Ử', 'U'], ['Ữ', 'U'],
            ['Ỳ', 'Y'], ['Ý', 'Y'], ['Ỵ', 'Y'], ['Ỷ', 'Y'], ['Ỹ', 'Y'],
            ['Đ', 'D'],
        ]
        let sql = columnName
        for (const [accented, plain] of replacements) {
            sql = `REPLACE(${sql}, '${accented}', '${plain}')`
        }
        return sql
    }

    private async findWithRawQuery(
        pagination: CourseEnrollmentPaginationOptions,
        filters: CourseEnrollmentFilterOptions,
    ): Promise<CourseEnrollmentListResult> {
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'enrolledAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        const conditions: string[] = []
        const params: any[] = []

        if (filters.courseId !== undefined) {
            conditions.push('ce.course_id = ?')
            params.push(filters.courseId)
        }

        if (filters.studentId !== undefined) {
            conditions.push('ce.student_id = ?')
            params.push(filters.studentId)
        }

        if (filters.status) {
            conditions.push('ce.status = ?')
            params.push(filters.status)
        }

        if (filters.enrolledAtFrom) {
            conditions.push('ce.enrolled_at >= ?')
            params.push(filters.enrolledAtFrom)
        }

        if (filters.enrolledAtTo) {
            conditions.push('ce.enrolled_at <= ?')
            params.push(filters.enrolledAtTo)
        }

        if (filters.courseVisibility) {
            conditions.push('c.visibility = ?')
            params.push(filters.courseVisibility)
        }

        if (filters.excludeVisibilities && filters.excludeVisibilities.length > 0) {
            conditions.push(`c.visibility NOT IN (${filters.excludeVisibilities.map(() => '?').join(',')})`)
            params.push(...filters.excludeVisibilities)
        }

        if (filters.search) {
            const searchPattern = `%${filters.search}%`
            const normalizedSearch = `%${TextSearchUtil.removeVietnameseAccents(filters.search)}%`

            const firstNameNoAccent = this.buildRemoveAccentsSQL('u.first_name')
            const lastNameNoAccent = this.buildRemoveAccentsSQL('u.last_name')
            const fullNameNoAccent = this.buildRemoveAccentsSQL(`CONCAT(u.last_name, ' ', u.first_name)`)
            const reverseFullNameNoAccent = this.buildRemoveAccentsSQL(`CONCAT(u.first_name, ' ', u.last_name)`)
            const courseTitleNoAccent = this.buildRemoveAccentsSQL('c.title')

            conditions.push(`(
                LOWER(u.first_name) LIKE LOWER(?) OR
                LOWER(u.last_name) LIKE LOWER(?) OR
                LOWER(CONCAT(u.last_name, ' ', u.first_name)) LIKE LOWER(?) OR
                LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER(?) OR
                LOWER(c.title) LIKE LOWER(?) OR
                LOWER(${firstNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${lastNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${fullNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${reverseFullNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${courseTitleNoAccent}) LIKE LOWER(?)
            )`)
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
            params.push(normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch)
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

        const columnMap: Record<string, string> = {
            enrolledAt: 'ce.enrolled_at',
            status: 'ce.status',
            courseId: 'ce.course_id',
            studentId: 'ce.student_id',
        }
        const orderColumn = columnMap[sortBy] || 'ce.enrolled_at'
        const orderByClause = `ORDER BY ${orderColumn} ${sortOrder}`

        const baseFrom = `
            FROM courses_enrollments ce
            INNER JOIN students s ON ce.student_id = s.student_id
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN courses c ON ce.course_id = c.course_id
            ${whereClause}
        `

        const countQuery = `SELECT COUNT(*) as total ${baseFrom}`
        const idsQuery = `SELECT ce.enrollment_id ${baseFrom} ${orderByClause} LIMIT ? OFFSET ?`

        const [countResult, idsResult] = await Promise.all([
            this.prisma.$queryRawUnsafe(countQuery, ...params) as Promise<[{ total: bigint }]>,
            this.prisma.$queryRawUnsafe(idsQuery, ...params, limit, skip) as Promise<{ enrollment_id: number }[]>,
        ])

        const total = Number(countResult[0].total)
        const ids = idsResult.map((r: any) => r.enrollment_id)

        const enrollments = ids.length === 0
            ? []
            : await this.prisma.courseEnrollment.findMany({
                where: { enrollmentId: { in: ids } },
                include: {
                    course: {
                        include: {
                            subject: true,
                            teacher: { include: { user: true } },
                            lessons: { include: { learningItems: true } },
                        },
                    },
                    student: { include: { user: true } },
                },
            })

        // Re-sort to match raw query order
        const idOrder = new Map(ids.map((id: number, i: number) => [id, i]))
        enrollments.sort((a: any, b: any) => (idOrder.get(a.enrollmentId) ?? 0) - (idOrder.get(b.enrollmentId) ?? 0))

        return {
            data: CourseEnrollmentMapper.toDomainCourseEnrollments(enrollments),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }
}
