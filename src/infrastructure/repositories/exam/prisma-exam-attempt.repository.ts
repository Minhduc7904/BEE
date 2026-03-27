import { Injectable } from '@nestjs/common'
import {
  ExamAttemptListResult,
  ExamAttemptPaginationOptions,
  IExamAttemptRepository,
  StudentExamAttemptFilterOptions,
} from '../../../domain/repositories/exam-attempt.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { ExamVisibility } from '../../../shared/enums/exam-visibility.enum'
import { ExamAttemptMapper } from '../../mappers/exam/exam-attempt.mapper'

@Injectable()
export class PrismaExamAttemptRepository implements IExamAttemptRepository {
  constructor(private readonly prisma: PrismaService | any) { }

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
