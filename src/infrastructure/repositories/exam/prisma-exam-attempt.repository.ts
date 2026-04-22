import { Injectable } from '@nestjs/common'
import {
  CreateExamAttemptData,
  ExamAttemptListResult,
  ExamAttemptPaginationOptions,
  IExamAttemptRepository,
  StudentExamAttemptFilterOptions,
} from '../../../domain/repositories/exam-attempt.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'
import { ExamVisibility } from '../../../shared/enums/exam-visibility.enum'
import { ExamAttemptMapper } from '../../mappers/exam/exam-attempt.mapper'

@Injectable()
export class PrismaExamAttemptRepository implements IExamAttemptRepository {
  constructor(private readonly prisma: PrismaService | any) { }

  async submitAttempt(
    attemptId: number,
    data: {
      status: ExamAttemptStatus
      endAt: Date
      score?: number | null
      points?: number | null
      maxPoints?: number | null
      gradedAt?: Date | null
      feedback?: string | null
    },
    txClient?: any,
  ) {
    const client = txClient || this.prisma

    const updated = await client.examAttempt.update({
      where: {
        attemptId,
      },
      data: {
        status: data.status,
        endAt: data.endAt,
        ...(data.score !== undefined ? { score: data.score } : {}),
        ...(data.points !== undefined ? { points: data.points } : {}),
        ...(data.maxPoints !== undefined ? { maxPoints: data.maxPoints } : {}),
        ...(data.gradedAt !== undefined ? { gradedAt: data.gradedAt } : {}),
        ...(data.feedback !== undefined ? { feedback: data.feedback } : {}),
      },
      include: {
        exam: true,
      },
    })

    return ExamAttemptMapper.toDomainExamAttempt(updated)!
  }

  async updateScoring(
    attemptId: number,
    data: {
      score?: number | null
      points?: number | null
      maxPoints?: number | null
      gradedAt?: Date | null
      feedback?: string | null
    },
    txClient?: any,
  ) {
    const client = txClient || this.prisma

    const updated = await client.examAttempt.update({
      where: {
        attemptId,
      },
      data: {
        ...(data.score !== undefined ? { score: data.score } : {}),
        ...(data.points !== undefined ? { points: data.points } : {}),
        ...(data.maxPoints !== undefined ? { maxPoints: data.maxPoints } : {}),
        ...(data.gradedAt !== undefined ? { gradedAt: data.gradedAt } : {}),
        ...(data.feedback !== undefined ? { feedback: data.feedback } : {}),
      },
      include: {
        exam: true,
      },
    })

    return ExamAttemptMapper.toDomainExamAttempt(updated)!
  }

  async hasSubmittedExamByStudent(
    studentId: number,
    examId: number,
    txClient?: any,
  ): Promise<boolean> {
    const client = txClient || this.prisma

    const count = await client.examAttempt.count({
      where: {
        studentId,
        examId,
        status: ExamAttemptStatus.SUBMITTED,
      },
    })

    return count > 0
  }

  async findSubmittedExamIdsByStudent(
    studentId: number,
    examIds: number[],
    txClient?: any,
  ): Promise<number[]> {
    if (examIds.length === 0) {
      return []
    }

    const client = txClient || this.prisma

    const rows = await client.examAttempt.findMany({
      where: {
        studentId,
        examId: { in: examIds },
        status: ExamAttemptStatus.SUBMITTED,
      },
      select: {
        examId: true,
      },
      distinct: ['examId'],
    })

    return rows.map((row: { examId: number }) => row.examId)
  }

  async findPublicByAttemptAndStudent(
    attemptId: number,
    studentId: number,
    txClient?: any,
  ) {
    const client = txClient || this.prisma

    const prismaAttempt = await client.examAttempt.findFirst({
      where: {
        attemptId,
        studentId,
        exam: {
          visibility: ExamVisibility.PUBLISHED,
        },
      },
      include: {
        exam: true,
      },
    })

    return ExamAttemptMapper.toDomainExamAttempt(prismaAttempt)
  }

  async create(data: CreateExamAttemptData, txClient?: any) {
    const client = txClient || this.prisma

    const created = await client.examAttempt.create({
      data: {
        examId: data.examId,
        studentId: data.studentId,
        status: data.status,
        startedAt: data.startedAt,
        duration: data.duration,
        questionIds: data.questionIds,
      },
      include: {
        exam: true,
      },
    })

    return ExamAttemptMapper.toDomainExamAttempt(created)!
  }

  async findQuestionIdsByExamId(examId: number, txClient?: any): Promise<number[]> {
    const client = txClient || this.prisma

    const rows = await client.questionExam.findMany({
      where: {
        examId,
      },
      orderBy: [
        { sectionId: 'asc' },
        { order: 'asc' },
        { questionId: 'asc' },
      ],
      select: {
        questionId: true,
      },
    })

    return rows.map((row: { questionId: number }) => row.questionId)
  }

  async findPublicByStudentWithPagination(
    studentId: number,
    pagination: ExamAttemptPaginationOptions,
    filters?: StudentExamAttemptFilterOptions,
    txClient?: any,
  ): Promise<ExamAttemptListResult> {
    const client = txClient || this.prisma

    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const sortBy = pagination.sortBy || 'startedAt'
    const sortOrder = pagination.sortOrder || 'desc'
    const skip = (page - 1) * limit

    const where: any = {
      studentId,
      examId: filters?.examId,
      status: filters?.status,
      exam: {
        visibility: ExamVisibility.PUBLISHED,
      },
    }

    const allowedSortFields = new Set(['attemptId', 'startedAt', 'endAt', 'score', 'points', 'maxPoints'])
    const [prismaAttempts, total] = await Promise.all([
      client.examAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: allowedSortFields.has(sortBy)
          ? { [sortBy]: sortOrder }
          : { startedAt: 'desc' },
        include: {
          exam: true,
        },
      }),
      client.examAttempt.count({ where }),
    ])

    const examAttempts = ExamAttemptMapper.toDomainExamAttempts(prismaAttempts)
    const totalPages = Math.ceil(total / limit)

    return {
      examAttempts,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async countByStudentDailyInYear(
    studentId: number,
    year: number,
    txClient?: any,
  ): Promise<{ date: string; count: number }[]> {
    const client = txClient || this.prisma
    const fromDate = `${year}-01-01`
    const toDate = `${year + 1}-01-01`

    const rows = await client.$queryRawUnsafe(
      `
      SELECT DATE(DATE_ADD(started_at, INTERVAL 7 HOUR)) AS date, COUNT(*) AS count
      FROM exam_attempts
      WHERE student_id = ?
        AND started_at IS NOT NULL
        AND DATE(DATE_ADD(started_at, INTERVAL 7 HOUR)) >= ?
        AND DATE(DATE_ADD(started_at, INTERVAL 7 HOUR)) < ?
      GROUP BY DATE(DATE_ADD(started_at, INTERVAL 7 HOUR))
      ORDER BY DATE(DATE_ADD(started_at, INTERVAL 7 HOUR)) ASC
      `,
      studentId,
      fromDate,
      toDate,
    ) as Array<{ date: string | Date; count: number | bigint }>

    return rows.map((row) => ({
      date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date),
      count: typeof row.count === 'bigint' ? Number(row.count) : row.count,
    }))
  }

  async getStudentActivityDatesVn(
    studentId: number,
    txClient?: any,
  ): Promise<string[]> {
    const client = txClient || this.prisma

    const rows = await client.$queryRawUnsafe(
      `
      SELECT DISTINCT DATE(DATE_ADD(started_at, INTERVAL 7 HOUR)) AS date
      FROM exam_attempts
      WHERE student_id = ?
        AND started_at IS NOT NULL
        AND DATE(DATE_ADD(started_at, INTERVAL 7 HOUR)) <= DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR))
      ORDER BY date DESC
      `,
      studentId,
    ) as Array<{ date: string | Date }>

    return rows.map((row) =>
      row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date),
    )
  }
}
