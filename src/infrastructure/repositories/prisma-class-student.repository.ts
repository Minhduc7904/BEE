// src/infrastructure/repositories/prisma-class-student.repository.ts
import { PrismaService } from '../../prisma/prisma.service'
import type { IClassStudentRepository } from '../../domain/repositories/class-student.repository'
import type {
    CreateClassStudentData,
    ClassStudentFilterOptions,
    ClassStudentPaginationOptions,
    ClassStudentListResult,
} from '../../domain/interface/class-student/class-student.interface'
import { ClassStudent } from '../../domain/entities/class-student/class-student.entity'
import { ClassStudentMapper } from '../mappers/class-student.mapper'
import { NumberUtil } from '../../shared/utils/number.util'

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

        const where: any = {}

        if (filters?.classId !== undefined) {
            where.classId = filters.classId
        }

        if (filters?.studentId !== undefined) {
            where.studentId = filters.studentId
        }

        if (filters?.search) {
            where.OR = [
                { courseClass: { className: { contains: filters.search } } },
                { student: { user: { firstName: { contains: filters.search } } } },
                { student: { user: { lastName: { contains: filters.search } } } },
            ]
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

    async findByClass(classId: number): Promise<ClassStudent[]> {
        const id = NumberUtil.ensureValidId(classId, 'Class ID')

        const prismaClassStudents = await this.prisma.classStudent.findMany({
            where: { classId: id },
            include: {
                courseClass: true,
                student: {
                    include: { user: true },
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
}
