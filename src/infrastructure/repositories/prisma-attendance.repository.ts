// src/infrastructure/repositories/prisma-attendance.repository.ts
import { PrismaService } from '../../prisma/prisma.service'
import type { IAttendanceRepository } from '../../domain/repositories/attendance.repository'
import type {
    CreateAttendanceData,
    UpdateAttendanceData,
    AttendanceFilterOptions,
    AttendancePaginationOptions,
    AttendanceListResult,
} from '../../domain/interface/attendance/attendance.interface'
import { Attendance } from '../../domain/entities/attendance/attendance.entity'
import { AttendanceMapper } from '../mappers/attendance.mapper'
import { NumberUtil } from '../../shared/utils/number.util'

export class PrismaAttendanceRepository implements IAttendanceRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateAttendanceData): Promise<Attendance> {
        const prismaAttendance = await this.prisma.attendance.create({
            data: {
                sessionId: data.sessionId,
                studentId: data.studentId,
                status: data.status,
                notes: data.notes,
                markerId: data.markerId,
                markedAt: new Date(),
            },
            include: {
                classSession: {
                    include: {
                        courseClass: true,
                    },
                },
                student: {
                    include: { user: true },
                },
                marker: {
                    include: { user: true },
                },
            },
        })

        return AttendanceMapper.toDomainAttendance(prismaAttendance)!
    }

    async findById(id: number): Promise<Attendance | null> {
        const attendanceId = NumberUtil.ensureValidId(id, 'Attendance ID')

        const prismaAttendance = await this.prisma.attendance.findUnique({
            where: { attendanceId },
            include: {
                classSession: {
                    include: {
                        courseClass: true,
                    },
                },
                student: {
                    include: { user: true },
                },
                marker: {
                    include: { user: true },
                },
            },
        })

        if (!prismaAttendance) return null
        return AttendanceMapper.toDomainAttendance(prismaAttendance)!
    }

    async update(id: number, data: UpdateAttendanceData): Promise<Attendance> {
        const attendanceId = NumberUtil.ensureValidId(id, 'Attendance ID')

        const prismaAttendance = await this.prisma.attendance.update({
            where: { attendanceId },
            data: {
                ...data,
                updatedAt: new Date(),
            },
            include: {
                classSession: {
                    include: {
                        courseClass: true,
                    },
                },
                student: {
                    include: { user: true },
                },
                marker: {
                    include: { user: true },
                },
            },
        })

        return AttendanceMapper.toDomainAttendance(prismaAttendance)!
    }

    async delete(id: number): Promise<boolean> {
        const attendanceId = NumberUtil.ensureValidId(id, 'Attendance ID')

        await this.prisma.attendance.delete({
            where: { attendanceId },
        })

        return true
    }

    async findAll(): Promise<Attendance[]> {
        const prismaAttendances = await this.prisma.attendance.findMany({
            include: {
                classSession: {
                    include: {
                        courseClass: true,
                    },
                },
                student: {
                    include: { user: true },
                },
                marker: {
                    include: { user: true },
                },
            },
            orderBy: {
                markedAt: 'desc',
            },
        })

        return AttendanceMapper.toDomainAttendances(prismaAttendances)
    }

    async findAllWithPagination(
        pagination: AttendancePaginationOptions,
        filters?: AttendanceFilterOptions,
    ): Promise<AttendanceListResult> {
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'markedAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        const where: any = {}

        if (filters?.sessionId !== undefined) {
            where.sessionId = filters.sessionId
        }

        if (filters?.studentId !== undefined) {
            where.studentId = filters.studentId
        }

        if (filters?.status) {
            where.status = filters.status
        }

        // Filter by classId through classSession relation
        if (filters?.classId !== undefined) {
            where.classSession = {
                classId: filters.classId,
            }
        }

        // Filter by date range (markedAt)
        if (filters?.fromDate || filters?.toDate) {
            where.markedAt = {}
            
            if (filters.fromDate) {
                where.markedAt.gte = new Date(filters.fromDate)
            }
            
            if (filters.toDate) {
                // Set time to end of day (23:59:59.999)
                const toDate = new Date(filters.toDate)
                toDate.setHours(23, 59, 59, 999)
                where.markedAt.lte = toDate
            }
        }

        if (filters?.search) {
            where.OR = [
                {
                    student: {
                        user: {
                            OR: [
                                {
                                    firstName: {
                                        contains: filters.search,
                                        
                                    },
                                },
                                {
                                    lastName: {
                                        contains: filters.search,
                                        
                                    },
                                },
                            ],
                        },
                    },
                },
                {
                    notes: {
                        contains: filters.search,
                        
                    },
                },
            ]
        }

        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaAttendances, total] = await Promise.all([
            this.prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    classSession: {
                        include: {
                            courseClass: true,
                        },
                    },
                    student: {
                        include: { user: true },
                    },
                    marker: {
                        include: { user: true },
                    },
                },
            }),
            this.prisma.attendance.count({ where }),
        ])

        const data = AttendanceMapper.toDomainAttendances(prismaAttendances)
        const totalPages = Math.ceil(total / limit)

        return {
            data,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async findBySession(sessionId: number): Promise<Attendance[]> {
        const id = NumberUtil.ensureValidId(sessionId, 'Session ID')

        const prismaAttendances = await this.prisma.attendance.findMany({
            where: { sessionId: id },
            include: {
                classSession: {
                    include: {
                        courseClass: true,
                    },
                },
                student: {
                    include: { user: true },
                },
                marker: {
                    include: { user: true },
                },
            },
            orderBy: {
                student: {
                    user: {
                        lastName: 'asc',
                    },
                },
            },
        })

        return AttendanceMapper.toDomainAttendances(prismaAttendances)
    }

    async findByStudent(studentId: number): Promise<Attendance[]> {
        const id = NumberUtil.ensureValidId(studentId, 'Student ID')

        const prismaAttendances = await this.prisma.attendance.findMany({
            where: { studentId: id },
            include: {
                classSession: {
                    include: {
                        courseClass: true,
                    },
                },
                student: {
                    include: { user: true },
                },
                marker: {
                    include: { user: true },
                },
            },
            orderBy: {
                markedAt: 'desc',
            },
        })

        return AttendanceMapper.toDomainAttendances(prismaAttendances)
    }

    async findBySessionAndStudent(
        sessionId: number,
        studentId: number,
    ): Promise<Attendance | null> {
        const sId = NumberUtil.ensureValidId(sessionId, 'Session ID')
        const stId = NumberUtil.ensureValidId(studentId, 'Student ID')

        const prismaAttendance = await this.prisma.attendance.findUnique({
            where: {
                sessionId_studentId: {
                    sessionId: sId,
                    studentId: stId,
                },
            },
            include: {
                classSession: {
                    include: {
                        courseClass: true,
                    },
                },
                student: {
                    include: { user: true },
                },
                marker: {
                    include: { user: true },
                },
            },
        })

        if (!prismaAttendance) return null
        return AttendanceMapper.toDomainAttendance(prismaAttendance)!
    }

    async createBulk(data: CreateAttendanceData[]): Promise<Attendance[]> {
        const createdAttendances = await Promise.all(
            data.map((item) => this.create(item)),
        )
        return createdAttendances
    }

    async updateBulk(
        updates: Array<{ id: number; data: UpdateAttendanceData }>,
    ): Promise<Attendance[]> {
        const updatedAttendances = await Promise.all(
            updates.map((item) => this.update(item.id, item.data)),
        )
        return updatedAttendances
    }

    async count(filters?: AttendanceFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.sessionId !== undefined) {
            where.sessionId = filters.sessionId
        }

        if (filters?.studentId !== undefined) {
            where.studentId = filters.studentId
        }

        if (filters?.status) {
            where.status = filters.status
        }

        if (filters?.classId !== undefined) {
            where.classSession = {
                classId: filters.classId,
            }
        }

        return this.prisma.attendance.count({ where })
    }

    async countBySession(sessionId: number): Promise<number> {
        const id = NumberUtil.ensureValidId(sessionId, 'Session ID')
        return this.prisma.attendance.count({ where: { sessionId: id } })
    }

    async countByStudent(studentId: number): Promise<number> {
        const id = NumberUtil.ensureValidId(studentId, 'Student ID')
        return this.prisma.attendance.count({ where: { studentId: id } })
    }
}
