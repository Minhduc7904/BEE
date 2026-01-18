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
        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'sessionDate'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        const where: any = {}

        if (filters?.classId !== undefined) {
            where.classId = filters.classId
        }

        if (filters?.search) {
            where.OR = [
                {
                    courseClass: {
                        className: {
                            contains: filters.search,
                            
                        },
                    },
                },
            ]
        }

        if (filters?.sessionDateFrom || filters?.sessionDateTo) {
            where.sessionDate = {}
            if (filters.sessionDateFrom) where.sessionDate.gte = filters.sessionDateFrom
            if (filters.sessionDateTo) where.sessionDate.lte = filters.sessionDateTo
        }

        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (filters?.isPast) {
            where.sessionDate = { lt: now }
        } else if (filters?.isToday) {
            where.sessionDate = { gte: now, lt: tomorrow }
        } else if (filters?.isUpcoming) {
            where.sessionDate = { gte: tomorrow }
        }

        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

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
