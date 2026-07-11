import type {
  CreateStudentPointLogData,
  IStudentPointLogRepository,
  StudentPointLogFilterOptions,
  StudentPointLogListResult,
  StudentPointLogPaginationOptions,
  UpdateStudentPointLogData,
} from '../../../domain/repositories/student-point-log.repository'
import { StudentPointLog } from '../../../domain/entities'
import { PointType } from '../../../shared/enums'
import { StudentPointLogMapper } from '../../mappers'
import { PrismaService } from '../../../prisma/prisma.service'

export class PrismaStudentPointLogRepository implements IStudentPointLogRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  private includeRelations = {
    student: {
      include: {
        user: true,
      },
    },
  }

  private signedPoints(type: PointType, points: number): number {
    return type === PointType.PENALTY ? -points : points
  }

  async create(data: CreateStudentPointLogData): Promise<StudentPointLog> {
    const created = await this.prisma.studentPointLog.create({
      data: {
        studentId: data.studentId,
        type: data.type,
        points: data.points,
        source: data.source,
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
        note: data.note ?? null,
        metadata: data.metadata,
      },
      include: this.includeRelations,
    })

    return StudentPointLogMapper.toDomainStudentPointLog(created)!
  }

  async findById(pointLogId: number): Promise<StudentPointLog | null> {
    const log = await this.prisma.studentPointLog.findUnique({
      where: {
        pointLogId,
      },
      include: this.includeRelations,
    })

    return StudentPointLogMapper.toDomainStudentPointLog(log) ?? null
  }

  async findByStudent(
    studentId: number,
    pagination: StudentPointLogPaginationOptions,
    filters?: StudentPointLogFilterOptions,
  ): Promise<StudentPointLogListResult> {
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const sortBy = pagination.sortBy || 'createdAt'
    const sortOrder = pagination.sortOrder || 'desc'
    const skip = (page - 1) * limit

    const where: any = {
      studentId,
    }

    if (filters?.type) where.type = filters.type
    if (filters?.source) where.source = filters.source
    if (filters?.referenceType) where.referenceType = filters.referenceType
    if (filters?.referenceId !== undefined) where.referenceId = filters.referenceId
    if (filters?.search) {
      where.OR = [
        { source: { contains: filters.search } },
        { referenceType: { contains: filters.search } },
        { note: { contains: filters.search } },
      ]
    }
    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {}
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate)
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate)
    }

    const [logs, total] = await Promise.all([
      this.prisma.studentPointLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: this.includeRelations,
      }),
      this.prisma.studentPointLog.count({ where }),
    ])

    return {
      data: StudentPointLogMapper.toDomainStudentPointLogs(logs),
      total,
    }
  }

  async findByReference(
    studentId: number,
    source: string,
    referenceType: string,
    referenceId: number,
  ): Promise<StudentPointLog | null> {
    const log = await this.prisma.studentPointLog.findFirst({
      where: {
        studentId,
        source,
        referenceType,
        referenceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: this.includeRelations,
    })

    return StudentPointLogMapper.toDomainStudentPointLog(log) ?? null
  }

  async createAndApply(data: CreateStudentPointLogData): Promise<StudentPointLog> {
    const log = await this.create(data)
    const delta = data.type === PointType.PENALTY ? -data.points : data.points

    await this.prisma.student.update({
      where: {
        studentId: data.studentId,
      },
      data: {
        totalPoint: {
          increment: delta,
        },
      },
    })

    return log
  }

  async syncByReferenceAndApply(data: CreateStudentPointLogData): Promise<StudentPointLog | null> {
    const existing = await this.prisma.studentPointLog.findFirst({
      where: {
        studentId: data.studentId,
        source: data.source,
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!existing && data.points <= 0) return null

    if (existing && data.points <= 0) {
      const oldDelta = existing.type === PointType.PENALTY ? -existing.points : existing.points

      await this.prisma.studentPointLog.delete({
        where: {
          pointLogId: existing.pointLogId,
        },
      })
      await this.prisma.student.update({
        where: {
          studentId: data.studentId,
        },
        data: {
          totalPoint: {
            increment: -oldDelta,
          },
        },
      })

      return null
    }

    if (!existing) {
      return this.createAndApply(data)
    }

    const oldDelta = existing.type === PointType.PENALTY ? -existing.points : existing.points
    const newDelta = data.type === PointType.PENALTY ? -data.points : data.points

    const updated = await this.prisma.studentPointLog.update({
      where: {
        pointLogId: existing.pointLogId,
      },
      data: {
        type: data.type,
        points: data.points,
        source: data.source,
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
        note: data.note ?? null,
        metadata: data.metadata,
      },
      include: this.includeRelations,
    })

    const delta = newDelta - oldDelta
    if (delta !== 0) {
      await this.prisma.student.update({
        where: {
          studentId: data.studentId,
        },
        data: {
          totalPoint: {
            increment: delta,
          },
        },
      })
    }

    return StudentPointLogMapper.toDomainStudentPointLog(updated) ?? null
  }

  async updateAndApply(pointLogId: number, data: UpdateStudentPointLogData): Promise<StudentPointLog> {
    const existing = await this.prisma.studentPointLog.findUnique({
      where: { pointLogId },
    })

    if (!existing) {
      throw new Error(`StudentPointLog with ID ${pointLogId} not found`)
    }

    const oldDelta = this.signedPoints(existing.type, existing.points)
    const nextType = data.type ?? existing.type
    const nextPoints = data.points ?? existing.points
    const newDelta = this.signedPoints(nextType, nextPoints)

    const updated = await this.prisma.studentPointLog.update({
      where: { pointLogId },
      data: {
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.points !== undefined ? { points: data.points } : {}),
        ...(data.source !== undefined ? { source: data.source } : {}),
        ...(data.referenceType !== undefined ? { referenceType: data.referenceType } : {}),
        ...(data.referenceId !== undefined ? { referenceId: data.referenceId } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
        ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
      },
      include: this.includeRelations,
    })

    const delta = newDelta - oldDelta
    if (delta !== 0) {
      await this.prisma.student.update({
        where: {
          studentId: existing.studentId,
        },
        data: {
          totalPoint: {
            increment: delta,
          },
        },
      })
    }

    return StudentPointLogMapper.toDomainStudentPointLog(updated)!
  }

  async deleteAndApply(pointLogId: number): Promise<StudentPointLog> {
    const existing = await this.prisma.studentPointLog.findUnique({
      where: { pointLogId },
      include: this.includeRelations,
    })

    if (!existing) {
      throw new Error(`StudentPointLog with ID ${pointLogId} not found`)
    }

    await this.prisma.studentPointLog.delete({
      where: { pointLogId },
    })

    const delta = -this.signedPoints(existing.type, existing.points)
    if (delta !== 0) {
      await this.prisma.student.update({
        where: {
          studentId: existing.studentId,
        },
        data: {
          totalPoint: {
            increment: delta,
          },
        },
      })
    }

    return StudentPointLogMapper.toDomainStudentPointLog(existing)!
  }
}
