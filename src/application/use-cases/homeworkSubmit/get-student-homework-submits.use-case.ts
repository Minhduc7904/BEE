import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentHomeworkSubmitListQueryDto } from '../../dtos/homeworkSubmit/student-homework-submit-list-query.dto'
import { NotFoundException, ValidationException } from '../../../shared/exceptions/custom-exceptions'
import { PrismaService } from '../../../prisma/prisma.service'

const SORTABLE_FIELDS = ['submitAt', 'gradedAt', 'points', 'createdAt', 'updatedAt'] as const
type SortableField = (typeof SORTABLE_FIELDS)[number]

@Injectable()
export class GetStudentHomeworkSubmitsUseCase {
  constructor(private readonly prisma: PrismaService) { }

  async execute(
    studentId: number,
    query: StudentHomeworkSubmitListQueryDto,
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
    const orderBy: Prisma.HomeworkSubmitOrderByWithRelationInput = {
      [sortBy]: query.sortOrder ?? 'desc',
    }

    // The narrow select deliberately excludes CompetitionSubmit.answers and Question data.
    const [homeworkSubmits, total] = await this.prisma.$transaction([
      this.prisma.homeworkSubmit.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: {
          homeworkSubmitId: true,
          homeworkContentId: true,
          competitionSubmitId: true,
          submitAt: true,
          content: true,
          points: true,
          gradedAt: true,
          graderId: true,
          feedback: true,
          createdAt: true,
          updatedAt: true,
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
          homeworkContent: {
            select: {
              homeworkContentId: true,
              type: true,
              dueDate: true,
              learningItem: {
                select: {
                  learningItemId: true,
                  title: true,
                },
              },
              competition: {
                select: {
                  competitionId: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.homeworkSubmit.count({ where }),
    ])

    return BaseResponseDto.success('Lấy danh sách bài nộp của học sinh thành công', {
      student: {
        studentId: student.studentId,
        fullName: `${student.user.lastName} ${student.user.firstName}`.trim(),
      },
      homeworkSubmits: homeworkSubmits.map((submit) => ({
        ...submit,
        points: submit.points ?? null,
        grader: submit.grader
          ? {
              adminId: submit.grader.adminId,
              fullName: `${submit.grader.user.firstName} ${submit.grader.user.lastName}`.trim(),
            }
          : null,
        competition: submit.homeworkContent.competition,
        homeworkContent: {
          homeworkContentId: submit.homeworkContent.homeworkContentId,
          type: submit.homeworkContent.type,
          dueDate: submit.homeworkContent.dueDate,
          learningItem: submit.homeworkContent.learningItem,
        },
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
    query: StudentHomeworkSubmitListQueryDto,
  ): Prisma.HomeworkSubmitWhereInput {
    const conditions: Prisma.HomeworkSubmitWhereInput[] = []
    const submittedFrom = query.submittedFrom ? new Date(query.submittedFrom) : undefined
    const submittedTo = query.submittedTo ? this.endOfDay(query.submittedTo) : undefined

    if (submittedFrom && submittedTo && submittedFrom > submittedTo) {
      throw new ValidationException('submittedFrom phải nhỏ hơn hoặc bằng submittedTo')
    }
    if (query.homeworkContentId) conditions.push({ homeworkContentId: query.homeworkContentId })
    if (query.competitionId) conditions.push({ homeworkContent: { competitionId: query.competitionId } })
    if (query.graderId) conditions.push({ graderId: query.graderId })
    if (query.isGraded !== undefined) {
      conditions.push({ points: query.isGraded ? { not: null } : null })
    }
    if (submittedFrom || submittedTo) {
      conditions.push({ submitAt: { ...(submittedFrom ? { gte: submittedFrom } : {}), ...(submittedTo ? { lte: submittedTo } : {}) } })
    }
    if (query.search) {
      conditions.push({
        OR: [
          { content: { contains: query.search } },
          { feedback: { contains: query.search } },
          { homeworkContent: { learningItem: { title: { contains: query.search } } } },
          { homeworkContent: { competition: { title: { contains: query.search } } } },
        ],
      })
    }

    return {
      studentId,
      ...(conditions.length ? { AND: conditions } : {}),
    }
  }

  private getSortBy(sortBy?: string): SortableField {
    return SORTABLE_FIELDS.includes(sortBy as SortableField) ? (sortBy as SortableField) : 'submitAt'
  }

  private endOfDay(value: string): Date {
    const date = new Date(value)
    date.setHours(23, 59, 59, 999)
    return date
  }
}
