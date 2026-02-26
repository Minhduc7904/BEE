// src/infrastructure/repositories/prisma-class-student.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { IClassStudentRepository } from '../../../domain/repositories/class-student.repository'
import type {
    CreateClassStudentData,
    ClassStudentFilterOptions,
    ClassStudentPaginationOptions,
    ClassStudentListResult,
} from '../../../domain/interface/class-student/class-student.interface'
import { ClassStudent } from '../../../domain/entities/class-student/class-student.entity'
import { ClassStudentMapper } from '../../mappers/class/class-student.mapper'
import { NumberUtil } from '../../../shared/utils/number.util'
import { TextSearchUtil } from '../../../shared/utils/text-search.util'

export class PrismaClassStudentRepository implements IClassStudentRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateClassStudentData): Promise<ClassStudent> {
        const prismaClassStudent = await this.prisma.classStudent.create({
            data: {
                classId: data.classId,
                studentId: data.studentId,
            },
            include: {
                courseClass: true,
                student: {
                    include: { user: true },
                },
            },
        })

        return ClassStudentMapper.toDomainClassStudent(prismaClassStudent)!
    }

    async createBulk(
        data: CreateClassStudentData[]
    ): Promise<ClassStudent[]> {

        if (!data.length) return [];

        // 1️⃣ createMany: chỉ để ghi
        await this.prisma.classStudent.createMany({
            data: data.map(item => ({
                classId: item.classId,
                studentId: item.studentId,
            })),
            skipDuplicates: true,
        });

        // 2️⃣ findMany: lấy lại đúng record vừa tạo
        const createdClassStudents = await this.prisma.classStudent.findMany({
            where: {
                OR: data.map(item => ({
                    classId: item.classId,
                    studentId: item.studentId,
                })),
            },
            include: {
                courseClass: true,
                student: {
                    include: { user: true },
                },
            },
        });

        return ClassStudentMapper.toDomainClassStudents(createdClassStudents);
    }


    async findByIds(classId: number, studentId: number): Promise<ClassStudent | null> {
        const cId = NumberUtil.ensureValidId(classId, 'Class ID')
        const sId = NumberUtil.ensureValidId(studentId, 'Student ID')

        const prismaClassStudent = await this.prisma.classStudent.findUnique({
            where: {
                classId_studentId: {
                    classId: cId,
                    studentId: sId,
                },
            },
            include: {
                courseClass: true,
                student: {
                    include: { user: true },
                },
            },
        })

        if (!prismaClassStudent) return null
        return ClassStudentMapper.toDomainClassStudent(prismaClassStudent)!
    }

    async delete(classId: number, studentId: number): Promise<boolean> {
        const cId = NumberUtil.ensureValidId(classId, 'Class ID')
        const sId = NumberUtil.ensureValidId(studentId, 'Student ID')

        await this.prisma.classStudent.delete({
            where: {
                classId_studentId: {
                    classId: cId,
                    studentId: sId,
                },
            },
        })

        return true
    }

    async findAll(): Promise<ClassStudent[]> {
        const prismaClassStudents = await this.prisma.classStudent.findMany({
            include: {
                courseClass: true,
                student: {
                    include: { user: true },
                },
            },
        })

        return ClassStudentMapper.toDomainClassStudents(prismaClassStudents)
    }

    async findAllWithPagination(
        pagination: ClassStudentPaginationOptions,
        filters?: ClassStudentFilterOptions,
    ): Promise<ClassStudentListResult> {
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'classId'
        const sortOrder = pagination.sortOrder || 'asc'
        const skip = (page - 1) * limit

        if (filters?.search) {
            return this.findWithRawQuery(pagination, filters)
        }

        const where: any = {}

        if (filters?.classId !== undefined) {
            where.classId = filters.classId
        }

        if (filters?.studentId !== undefined) {
            where.studentId = filters.studentId
        }

        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaClassStudents, total] = await Promise.all([
            this.prisma.classStudent.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    courseClass: true,
                    student: {
                        include: { user: true },
                    },
                },
            }),
            this.prisma.classStudent.count({ where }),
        ])

        const data = ClassStudentMapper.toDomainClassStudents(prismaClassStudents)
        const totalPages = Math.ceil(total / limit)

        return {
            data,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async findByClass(
        classId: number,
        isActive?: boolean,
    ): Promise<ClassStudent[]> {
        const id = NumberUtil.ensureValidId(classId, 'Class ID')

        const prismaClassStudents = await this.prisma.classStudent.findMany({
            where: {
                classId: id,
                ...(isActive !== undefined && {
                    student: {
                        user: {
                            isActive,
                        },
                    },
                }),
            },
            include: {
                courseClass: true,
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        return ClassStudentMapper.toDomainClassStudents(prismaClassStudents)
    }


    async findByStudent(studentId: number): Promise<ClassStudent[]> {
        const id = NumberUtil.ensureValidId(studentId, 'Student ID')

        const prismaClassStudents = await this.prisma.classStudent.findMany({
            where: { studentId: id },
            include: {
                courseClass: true,
                student: {
                    include: { user: true },
                },
            },
        })

        return ClassStudentMapper.toDomainClassStudents(prismaClassStudents)
    }

    async exists(classId: number, studentId: number): Promise<boolean> {
        const cId = NumberUtil.ensureValidId(classId, 'Class ID')
        const sId = NumberUtil.ensureValidId(studentId, 'Student ID')

        const count = await this.prisma.classStudent.count({
            where: { classId: cId, studentId: sId },
        })

        return count > 0
    }

    async count(filters?: ClassStudentFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.classId !== undefined) where.classId = filters.classId
        if (filters?.studentId !== undefined) where.studentId = filters.studentId

        return this.prisma.classStudent.count({ where })
    }

    async countByClass(classId: number): Promise<number> {
        const id = NumberUtil.ensureValidId(classId, 'Class ID')
        return this.prisma.classStudent.count({ where: { classId: id } })
    }

    async countByStudent(studentId: number): Promise<number> {
        const id = NumberUtil.ensureValidId(studentId, 'Student ID')
        return this.prisma.classStudent.count({ where: { studentId: id } })
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
        pagination: ClassStudentPaginationOptions,
        filters: ClassStudentFilterOptions,
    ): Promise<ClassStudentListResult> {
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'classId'
        const sortOrder = pagination.sortOrder || 'asc'
        const skip = (page - 1) * limit

        const conditions: string[] = []
        const params: any[] = []

        if (filters.classId !== undefined) {
            conditions.push('cs.class_id = ?')
            params.push(filters.classId)
        }

        if (filters.studentId !== undefined) {
            conditions.push('cs.student_id = ?')
            params.push(filters.studentId)
        }

        if (filters.search) {
            const searchPattern = `%${filters.search}%`
            const normalizedSearch = `%${TextSearchUtil.removeVietnameseAccents(filters.search)}%`

            const firstNameNoAccent = this.buildRemoveAccentsSQL('u.first_name')
            const lastNameNoAccent = this.buildRemoveAccentsSQL('u.last_name')
            const fullNameNoAccent = this.buildRemoveAccentsSQL(`CONCAT(u.last_name, ' ', u.first_name)`)
            const reverseFullNameNoAccent = this.buildRemoveAccentsSQL(`CONCAT(u.first_name, ' ', u.last_name)`)
            const classNameNoAccent = this.buildRemoveAccentsSQL('cc.class_name')

            conditions.push(`(
                LOWER(u.first_name) LIKE LOWER(?) OR
                LOWER(u.last_name) LIKE LOWER(?) OR
                LOWER(CONCAT(u.last_name, ' ', u.first_name)) LIKE LOWER(?) OR
                LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER(?) OR
                LOWER(cc.class_name) LIKE LOWER(?) OR
                LOWER(${firstNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${lastNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${fullNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${reverseFullNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${classNameNoAccent}) LIKE LOWER(?)
            )`)
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
            params.push(normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch)
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

        const columnMap: Record<string, string> = {
            classId: 'cs.class_id',
            studentId: 'cs.student_id',
        }
        const orderColumn = columnMap[sortBy] || 'cs.class_id'
        const orderByClause = `ORDER BY ${orderColumn} ${sortOrder}`

        const baseFrom = `
            FROM classes_students cs
            INNER JOIN students s ON cs.student_id = s.student_id
            INNER JOIN users u ON s.user_id = u.user_id
            LEFT JOIN courses_classes cc ON cs.class_id = cc.class_id
            ${whereClause}
        `

        const countQuery = `SELECT COUNT(*) as total ${baseFrom}`
        const idsQuery = `SELECT cs.class_id, cs.student_id ${baseFrom} ${orderByClause} LIMIT ? OFFSET ?`

        const [countResult, idsResult] = await Promise.all([
            this.prisma.$queryRawUnsafe(countQuery, ...params) as Promise<[{ total: bigint }]>,
            this.prisma.$queryRawUnsafe(idsQuery, ...params, limit, skip) as Promise<{ class_id: number; student_id: number }[]>,
        ])

        const total = Number(countResult[0].total)
        const pairs = idsResult.map((r: any) => ({ classId: r.class_id, studentId: r.student_id }))

        const classStudents = pairs.length === 0
            ? []
            : await this.prisma.classStudent.findMany({
                where: { OR: pairs.map((p: any) => ({ classId: p.classId, studentId: p.studentId })) },
                include: {
                    courseClass: true,
                    student: { include: { user: true } },
                },
            })

        // Re-sort to match raw query order
        classStudents.sort((a: any, b: any) => {
            const aIdx = pairs.findIndex((p: any) => p.classId === a.classId && p.studentId === a.studentId)
            const bIdx = pairs.findIndex((p: any) => p.classId === b.classId && p.studentId === b.studentId)
            return aIdx - bIdx
        })

        return {
            data: ClassStudentMapper.toDomainClassStudents(classStudents),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }
}
