import { Injectable } from '@nestjs/common'
import { ExamImportSession } from '../../../domain/entities/exam-import/exam-import-session.entity'
import {
  CreateExamImportSessionData,
  IExamImportSessionRepository,
  UpdateExamImportSessionData,
  FindAllExamImportSessionsOptions,
  FindAllExamImportSessionsResult,
} from '../../../domain/repositories/exam-import-session.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { ExamImportSessionMapper } from '../../mappers/exam-import/exam-import-session.mapper'
import { ImportStatus } from '../../../shared/enums'

@Injectable()
export class PrismaExamImportSessionRepository implements IExamImportSessionRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateExamImportSessionData): Promise<ExamImportSession> {
    const created = await this.prisma.examImportSession.create({
      data: {
        rawContent: data.rawContent,
        metadata: data.metadata,
        createdBy: data.createdBy,
        status: ImportStatus.PENDING,
      },
    })

    return ExamImportSessionMapper.toDomainExamImportSession(created)!
  }

  async findById(sessionId: number): Promise<ExamImportSession | null> {
    const session = await this.prisma.examImportSession.findUnique({
      where: { sessionId },
    })

    if (!session) return null

    return ExamImportSessionMapper.toDomainExamImportSession(session)!
  }

  async findByIdWithRelations(sessionId: number): Promise<ExamImportSession | null> {
    const session = await this.prisma.examImportSession.findUnique({
      where: { sessionId },
      include: {
        tempExam: {
          include: {
            subject: true,
            tempSections: {
              include: {
                tempQuestions: {
                  include: {
                    subject: true,
                    tempStatements: true,
                  },
                },
              },
            },
          },
        },
        tempSections: {
          include: {
            tempQuestions: {
              include: {
                subject: true,
                tempStatements: true,
              },
            },
          },
        },
        tempQuestions: {
          include: {
            subject: true,
            tempStatements: true,
          },
        },
      },
    })

    if (!session) return null

    return ExamImportSessionMapper.toDomainExamImportSession(session)!
  }

  async findAll(
    options: FindAllExamImportSessionsOptions,
  ): Promise<FindAllExamImportSessionsResult> {
    const where: any = {}

    // Status filter
    if (options.status) {
      where.status = options.status
    }

    // Created by filter
    if (options.createdBy) {
      where.createdBy = options.createdBy
    }

    // Search filter
    if (options.search) {
      where.OR = [
        { fileName: { contains: options.search } },
        { errorLog: { contains: options.search } },
      ]
    }

    // Date range filter
    if (options.fromDate || options.toDate) {
      where.createdAt = {}
      if (options.fromDate) {
        where.createdAt.gte = options.fromDate
      }
      if (options.toDate) {
        where.createdAt.lte = options.toDate
      }
    }

    // Sort configuration
    const orderBy: any = {}
    if (options.sortBy) {
      orderBy[options.sortBy] = options.sortOrder || 'asc'
    } else {
      orderBy.createdAt = 'desc'
    }

    // Execute queries in parallel
    const [sessions, total] = await Promise.all([
      this.prisma.examImportSession.findMany({
        where,
        orderBy,
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.examImportSession.count({ where }),
    ])

    return {
      data: ExamImportSessionMapper.toDomainExamImportSessions(sessions),
      total,
    }
  }

  async findByStatus(status: ImportStatus): Promise<ExamImportSession[]> {
    const sessions = await this.prisma.examImportSession.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    })

    return ExamImportSessionMapper.toDomainExamImportSessions(sessions)
  }

  async findByCreatedBy(createdBy: number): Promise<ExamImportSession[]> {
    const sessions = await this.prisma.examImportSession.findMany({
      where: { createdBy },
      orderBy: { createdAt: 'desc' },
    })

    return ExamImportSessionMapper.toDomainExamImportSessions(sessions)
  }

  async update(
    sessionId: number,
    data: UpdateExamImportSessionData,
  ): Promise<ExamImportSession> {
    const updated = await this.prisma.examImportSession.update({
      where: { sessionId },
      data: {
        status: data.status,
        rawContent: data.rawContent,
        metadata: data.metadata,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt,
        completedAt: data.completedAt,
      },
    })

    return ExamImportSessionMapper.toDomainExamImportSession(updated)!
  }

  async delete(sessionId: number): Promise<void> {
    await this.prisma.examImportSession.delete({
      where: { sessionId },
    })
  }

  async updateStatus(sessionId: number, status: ImportStatus): Promise<ExamImportSession> {
    const updated = await this.prisma.examImportSession.update({
      where: { sessionId },
      data: { status },
    })

    return ExamImportSessionMapper.toDomainExamImportSession(updated)!
  }

  async approve(sessionId: number, approvedBy: number): Promise<ExamImportSession> {
    const updated = await this.prisma.examImportSession.update({
      where: { sessionId },
      data: {
        status: ImportStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
    })

    return ExamImportSessionMapper.toDomainExamImportSession(updated)!
  }

  async complete(sessionId: number): Promise<ExamImportSession> {
    const updated = await this.prisma.examImportSession.update({
      where: { sessionId },
      data: {
        status: ImportStatus.COMPLETED,
        completedAt: new Date(),
      },
    })

    return ExamImportSessionMapper.toDomainExamImportSession(updated)!
  }
}
