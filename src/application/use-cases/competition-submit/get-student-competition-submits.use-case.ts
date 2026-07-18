import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentCompetitionSubmitListQueryDto } from '../../dtos/competition-submit/student-competition-submit-list-query.dto'
import { NotFoundException, ValidationException } from '../../../shared/exceptions/custom-exceptions'
import { PrismaService } from '../../../prisma/prisma.service'

const SORTABLE_FIELDS = [
  'startedAt',
  'submittedAt',
  'gradedAt',
  'totalPoints',
  'maxPoints',
  'timeSpentSeconds',
  'attemptNumber',
  'createdAt',
  'updatedAt',
] as const
type SortableField = (typeof SORTABLE_FIELDS)[number]

@Injectable()
export class GetStudentCompetitionSubmitsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns a compact admin-facing competition-submit list for exactly one student.
   *
   * The query deliberately uses `select`, rather than a relation `include`, so the
   * database never loads CompetitionAnswer, Question, Statement, or exam content.
   * This endpoint is intended for list screens; use the detail endpoint only when
   * answers are actually needed.
   */
  async execute(
    studentId: number,
    query: StudentCompetitionSubmitListQueryDto,
  ): Promise<BaseResponseDto<any>> {
    const student = await this.prisma.student.findUnique({
      where: { studentId },
      select: {
        studentId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!student) {
      throw new NotFoundException('Không tìm thấy học sinh')
    }

    const where = this.buildWhere(studentId, query)
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const sortBy = this.getSortBy(query.sortBy)
    const orderBy: Prisma.CompetitionSubmitOrderByWithRelationInput = {
      [sortBy]: query.sortOrder ?? 'desc',
    }

    const [competitionSubmits, total] = await this.prisma.$transaction([
      this.prisma.competitionSubmit.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        // Narrow list projection: no competitionAnswers, questions, statements, or exam data.
        select: {
          competitionSubmitId: true,
          competitionId: true,
          attemptNumber: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          gradedAt: true,
          totalPoints: true,
          maxPoints: true,
          timeSpentSeconds: true,
          graderId: true,
          feedback: true,
          createdAt: true,
          updatedAt: true,
          competition: {
            select: {
              competitionId: true,
              title: true,
            },
          },
          grader: {
            select: {
              adminId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.competitionSubmit.count({ where }),
    ])

    return BaseResponseDto.success('Lấy danh sách bài nộp cuộc thi của học sinh thành công', {
      student: {
        studentId: student.studentId,
        fullName: `${student.user.lastName} ${student.user.firstName}`.trim(),
      },
      competitionSubmits: competitionSubmits.map((submit) => ({
        ...submit,
        totalPoints: submit.totalPoints === null ? null : Number(submit.totalPoints),
        maxPoints: submit.maxPoints === null ? null : Number(submit.maxPoints),
        grader: submit.grader
          ? {
              adminId: submit.grader.adminId,
              fullName: `${submit.grader.user.lastName} ${submit.grader.user.firstName}`.trim(),
            }
          : null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  }

  private buildWhere(
    studentId: number,
    query: StudentCompetitionSubmitListQueryDto,
  ): Prisma.CompetitionSubmitWhereInput {
    const conditions: Prisma.CompetitionSubmitWhereInput[] = []
    const startedFrom = query.startedFrom ? new Date(query.startedFrom) : undefined
    const startedTo = query.startedTo ? this.endOfDay(query.startedTo) : undefined
    const submittedFrom = query.submittedFrom ? new Date(query.submittedFrom) : undefined
    const submittedTo = query.submittedTo ? this.endOfDay(query.submittedTo) : undefined

    if (startedFrom && startedTo && startedFrom > startedTo) {
      throw new ValidationException('startedFrom phải nhỏ hơn hoặc bằng startedTo')
    }
    if (submittedFrom && submittedTo && submittedFrom > submittedTo) {
      throw new ValidationException('submittedFrom phải nhỏ hơn hoặc bằng submittedTo')
    }

    if (query.competitionId) conditions.push({ competitionId: query.competitionId })
    if (query.graderId) conditions.push({ graderId: query.graderId })
    if (query.status) conditions.push({ status: query.status })
    if (query.isGraded !== undefined) {
      conditions.push({ gradedAt: query.isGraded ? { not: null } : null })
    }
    if (startedFrom || startedTo) {
      conditions.push({
        startedAt: {
          ...(startedFrom ? { gte: startedFrom } : {}),
          ...(startedTo ? { lte: startedTo } : {}),
        },
      })
    }
    if (submittedFrom || submittedTo) {
      conditions.push({
        submittedAt: {
          ...(submittedFrom ? { gte: submittedFrom } : {}),
          ...(submittedTo ? { lte: submittedTo } : {}),
        },
      })
    }
    if (query.search?.trim()) {
      const search = query.search.trim()
      conditions.push({
        OR: [
          { feedback: { contains: search } },
          { competition: { title: { contains: search } } },
        ],
      })
    }

    return {
      studentId,
      ...(conditions.length ? { AND: conditions } : {}),
    }
  }

  private getSortBy(sortBy?: string): SortableField {
    return SORTABLE_FIELDS.includes(sortBy as SortableField) ? (sortBy as SortableField) : 'startedAt'
  }

  private endOfDay(value: string): Date {
    const date = new Date(value)
    date.setHours(23, 59, 59, 999)
    return date
  }
}
