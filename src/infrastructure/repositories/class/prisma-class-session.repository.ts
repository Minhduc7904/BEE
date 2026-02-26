// src/infrastructure/repositories/prisma-class-session.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { IClassSessionRepository } from '../../../domain/repositories/class-session.repository'
import type {
    CreateClassSessionData,
    UpdateClassSessionData,
    ClassSessionFilterOptions,
    ClassSessionPaginationOptions,
    ClassSessionListResult,
} from '../../../domain/interface/class-session/class-session.interface'
import { ClassSession } from '../../../domain/entities/class-session/class-session.entity'
import { ClassSessionMapper } from '../../mappers/class/class-session.mapper'
import { NumberUtil } from '../../../shared/utils/number.util'

export class PrismaClassSessionRepository implements IClassSessionRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateClassSessionData): Promise<ClassSession> {
        const prismaSession = await this.prisma.classSession.create({
            data: {
                classId: data.classId,
                name: data.name,
                sessionDate: data.sessionDate,
                startTime: data.startTime,
                endTime: data.endTime,
                makeupNote: data.makeupNote,
            },
            include: {
                courseClass: true,
            },
        })

        return ClassSessionMapper.toDomainClassSession(prismaSession)!
    }

    async findById(id: number): Promise<ClassSession | null> {
        const sessionId = NumberUtil.ensureValidId(id, 'Session ID')

        const prismaSession = await this.prisma.classSession.findUnique({
            where: { sessionId },
            include: {
                courseClass: true,
            },
        })

        if (!prismaSession) return null
        return ClassSessionMapper.toDomainClassSession(prismaSession)!
    }

    async findByIds(ids: number[]): Promise<ClassSession[]> {
        const sessionIds = ids.map((id) => NumberUtil.ensureValidId(id, 'Session ID'))
        const prismaSessions = await this.prisma.classSession.findMany({
            where: { sessionId: { in: sessionIds } },
            include: {
                courseClass: true,
            },
        })
        return ClassSessionMapper.toDomainClassSessions(prismaSessions)
    }

    async update(id: number, data: UpdateClassSessionData): Promise<ClassSession> {
        const sessionId = NumberUtil.ensureValidId(id, 'Session ID')

        const prismaSession = await this.prisma.classSession.update({
            where: { sessionId },
            data: { ...data },
            include: {
                courseClass: true,
            },
        })

        return ClassSessionMapper.toDomainClassSession(prismaSession)!
    }

    async delete(id: number): Promise<boolean> {
        const sessionId = NumberUtil.ensureValidId(id, 'Session ID')

        await this.prisma.classSession.delete({
            where: { sessionId },
        })

        return true
    }

    async findAll(): Promise<ClassSession[]> {
        const prismaSessions = await this.prisma.classSession.findMany({
            include: {
                courseClass: true,
            },
            orderBy: {
                sessionDate: 'desc',
            },
        })

        return ClassSessionMapper.toDomainClassSessions(prismaSessions)
    }

    async findAllWithPagination(
        pagination: ClassSessionPaginationOptions,
        filters?: ClassSessionFilterOptions,
    ): Promise<ClassSessionListResult> {
        const page = pagination.page ?? 1
        const limit = pagination.limit ?? 10
        const sortBy = pagination.sortBy ?? 'sessionDate'
        const sortOrder = pagination.sortOrder ?? 'desc'
        const skip = (page - 1) * limit

        const where: any = {}
        const andConditions: any[] = []

        /* ===================== CLASS FILTER ===================== */

        if (filters?.classIds?.length) {
            andConditions.push({
                classId: {
                    in: filters.classIds,
                },
            })
        } else if (filters?.classId !== undefined) {
            andConditions.push({
                classId: filters.classId,
            })
        }

        /* ===================== SEARCH ===================== */

        if (filters?.search) {
            andConditions.push({
                OR: [
                    {
                        courseClass: {
                            className: {
                                contains: filters.search,
                            },
                        },
                    },
                ],
            })
        }

        /* ===================== DATE RANGE ===================== */

        if (filters?.sessionDateFrom || filters?.sessionDateTo) {
            const dateFilter: any = {}
            
            if (filters.sessionDateFrom) {
                const fromDate = new Date(filters.sessionDateFrom)
                fromDate.setHours(0, 0, 0, 0)
                dateFilter.gte = fromDate
            }
            
            if (filters.sessionDateTo) {
                const toDate = new Date(filters.sessionDateTo)
                toDate.setHours(23, 59, 59, 999)
                dateFilter.lte = toDate
            }
            
            andConditions.push({
                sessionDate: dateFilter,
            })
        }

        /* ===================== DATE STATUS ===================== */

        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (filters?.isPast) {
            andConditions.push({
                sessionDate: { lt: now },
            })
        } else if (filters?.isToday) {
            andConditions.push({
                sessionDate: { gte: now, lt: tomorrow },
            })
        } else if (filters?.isUpcoming) {
            andConditions.push({
                sessionDate: { gte: tomorrow },
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

        const [prismaSessions, total] = await Promise.all([
            this.prisma.classSession.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    courseClass: true,
                },
            }),
            this.prisma.classSession.count({ where }),
        ])

        const data = ClassSessionMapper.toDomainClassSessions(prismaSessions)
        const totalPages = Math.ceil(total / limit)

        return {
            data,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async findStudentClassSessionsWithPagination(
        studentId: number,
        pagination: ClassSessionPaginationOptions,
        filters?: ClassSessionFilterOptions,
    ): Promise<ClassSessionListResult> {
        const page = pagination.page ?? 1
        const limit = pagination.limit ?? 10
        const sortBy = pagination.sortBy ?? 'sessionDate'
        const sortOrder = pagination.sortOrder ?? 'desc'
        const skip = (page - 1) * limit

        const where: any = {
            courseClass: {
                classStudents: {
                    some: {
                        studentId: studentId,
                    },
                },
            },
        }

        const andConditions: any[] = []

        /* ===================== CLASS FILTER ===================== */

        if (filters?.classIds?.length) {
            andConditions.push({
                classId: {
                    in: filters.classIds,
                },
            })
        } else if (filters?.classId !== undefined) {
            andConditions.push({
                classId: filters.classId,
            })
        }

        /* ===================== DATE RANGE ===================== */

        if (filters?.sessionDateFrom || filters?.sessionDateTo) {
            const dateFilter: any = {}
            
            if (filters.sessionDateFrom) {
                const fromDate = new Date(filters.sessionDateFrom)
                fromDate.setHours(0, 0, 0, 0)
                dateFilter.gte = fromDate
            }
            
            if (filters.sessionDateTo) {
                const toDate = new Date(filters.sessionDateTo)
                toDate.setHours(23, 59, 59, 999)
                dateFilter.lte = toDate
            }
            
            andConditions.push({
                sessionDate: dateFilter,
            })
        }

        /* ===================== DATE STATUS ===================== */

        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (filters?.isPast) {
            andConditions.push({
                sessionDate: { lt: now },
            })
        } else if (filters?.isToday) {
            andConditions.push({
                sessionDate: { gte: now, lt: tomorrow },
            })
        } else if (filters?.isUpcoming) {
            andConditions.push({
                sessionDate: { gte: tomorrow },
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

        const [prismaSessions, total] = await Promise.all([
            this.prisma.classSession.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    courseClass: {
                        include: {
                            course: true,
                        },
                    },
                    attendances: {
                        where: {
                            studentId: studentId,
                        },
                    },
                },
            }),
            this.prisma.classSession.count({ where }),
        ])

        const data = ClassSessionMapper.toDomainClassSessions(prismaSessions)
        const totalPages = Math.ceil(total / limit)

        return {
            data,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async findByClass(classId: number): Promise<ClassSession[]> {
        const id = NumberUtil.ensureValidId(classId, 'Class ID')

        const prismaSessions = await this.prisma.classSession.findMany({
            where: { classId: id },
            include: {
                courseClass: true,
            },
            orderBy: {
                sessionDate: 'asc',
            },
        })

        return ClassSessionMapper.toDomainClassSessions(prismaSessions)
    }

    async findByDate(date: Date): Promise<ClassSession[]> {
        const start = new Date(date)
        start.setHours(0, 0, 0, 0)
        const end = new Date(date)
        end.setHours(23, 59, 59, 999)

        const prismaSessions = await this.prisma.classSession.findMany({
            where: {
                sessionDate: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                courseClass: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        })

        return ClassSessionMapper.toDomainClassSessions(prismaSessions)
    }

    async count(filters?: ClassSessionFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.classId !== undefined) {
            where.classId = filters.classId
        }

        return this.prisma.classSession.count({ where })
    }

    async countByClass(classId: number): Promise<number> {
        const id = NumberUtil.ensureValidId(classId, 'Class ID')
        return this.prisma.classSession.count({ where: { classId: id } })
    }
}
