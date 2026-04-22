// src/infrastructure/repositories/exam/prisma-exam.repository.ts
import { Injectable } from '@nestjs/common'
import { Exam } from '../../../domain/entities/exam/exam.entity'
import {
  IExamRepository,
  CreateExamData,
  ExamFilterOptions,
  ExamPaginationOptions,
  ExamListResult,
  PublishedExamTypeCount,
} from '../../../domain/repositories/exam.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { ExamMapper } from '../../mappers/exam/exam.mapper'
import { ExamVisibility, TypeOfExam } from '../../../shared/enums'
import { TextSearchUtil } from '../../../shared/utils/text-search.util'

@Injectable()
export class PrismaExamRepository implements IExamRepository {
  constructor(private readonly prisma: PrismaService | any) { }

  async create(data: CreateExamData, txClient?: any): Promise<Exam> {
    const client = txClient || this.prisma

    const created = await client.exam.create({
      data: {
        title: data.title,
        description: data.description,
        grade: data.grade,
        visibility: data.visibility,
        solutionYoutubeUrl: data.solutionYoutubeUrl,
        typeOfExam: data.typeOfExam,
        admin: {
          connect: { adminId: data.adminId },
        },
        ...(data.subjectId && {
          subject: {
            connect: { subjectId: data.subjectId },
          },
        }),
      },
    })

    return ExamMapper.toDomainExam(created)!
  }

  async findById(id: number, txClient?: any): Promise<Exam | null> {
    const client = txClient || this.prisma

    const exam = await client.exam.findUnique({
      where: { examId: id },
      include: {
        subject: true,
        admin: {
          include: {
            user: true,
          },
        },
        competitions: {
          orderBy: { createdAt: 'desc' },
          include: {
            admin: {
              include: {
                user: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    })

    if (!exam) return null

    return ExamMapper.toDomainExam(exam)
  }

  async findByIdWithFullDetails(id: number, txClient?: any): Promise<Exam | null> {
    const client = txClient || this.prisma

    const exam = await client.exam.findUnique({
      where: { examId: id },
      include: {
        subject: true,
        admin: {
          include: {
            user: true,
          },
        },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                question: {
                  include: {
                    statements: {
                      orderBy: { order: 'asc' },
                    },
                    questionChapters: {
                      include: {
                        chapter: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        questions: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                statements: {
                  orderBy: { order: 'asc' },
                },
                questionChapters: {
                  include: {
                    chapter: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!exam) return null

    return ExamMapper.toDomainExam(exam)
  }

  async update(id: number, data: Partial<CreateExamData>, txClient?: any): Promise<Exam> {
    const client = txClient || this.prisma

    const updated = await client.exam.update({
      where: { examId: id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.grade && { grade: data.grade }),
        ...(data.visibility && { visibility: data.visibility }),
        ...(data.solutionYoutubeUrl !== undefined && { solutionYoutubeUrl: data.solutionYoutubeUrl }),
        ...(data.typeOfExam !== undefined && { typeOfExam: data.typeOfExam }),
      },
    })

    return ExamMapper.toDomainExam(updated)!
  }

  async delete(id: number, txClient?: any): Promise<void> {
    const client = txClient || this.prisma

    await client.exam.delete({
      where: { examId: id },
    })
  }

  async findAllWithPagination(
    pagination: ExamPaginationOptions,
    filters?: ExamFilterOptions,
    txClient?: any,
  ): Promise<ExamListResult> {
    const client = txClient || this.prisma

    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const sortBy = pagination.sortBy || 'createdAt'
    const sortOrder = pagination.sortOrder || 'desc'
    const skip = (page - 1) * limit

    if (filters?.search) {
      return this.findWithRawQuery(client, pagination, filters)
    }

    // Build where clause
    const where: any = {}

    if (filters?.subjectId !== undefined) {
      where.subjectId = filters.subjectId
    }

    if (filters?.grade !== undefined) {
      where.grade = filters.grade
    }

    if (filters?.typeOfExam !== undefined) {
      where.typeOfExam = filters.typeOfExam
    }

    if (filters?.visibility) {
      where.visibility = filters.visibility
    }

    if (filters?.excludeVisibility) {
      where.visibility = { not: filters.excludeVisibility }
    }

    if (filters?.createdBy !== undefined) {
      where.createdBy = filters.createdBy
    }

    if (filters?.chapterIds !== undefined && filters.chapterIds.length > 0) {
      where.questions = {
        some: {
          question: {
            questionChapters: {
              some: {
                chapterId: {
                  in: filters.chapterIds,
                },
              },
            },
          },
        },
      }
    }

    // Build orderBy
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [prismaExams, total] = await Promise.all([
      client.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          subject: true,
          admin: {
            include: {
              user: true,
            },
          },
          competitions: {
            orderBy: { createdAt: 'desc' },
            include: {
              admin: {
                include: {
                  user: true,
                },
              },
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
      }),
      client.exam.count({ where }),
    ])

    const exams = ExamMapper.toDomainExams(prismaExams)
    const totalPages = Math.ceil(total / limit)

    return {
      exams,
      total,
      page,
      limit,
      totalPages,
    }
  }

  private buildRemoveAccentsSQL(columnName: string): string {
    const replacements = [
      ['à', 'a'], ['á', 'a'], ['ạ', 'a'], ['ả', 'a'], ['ã', 'a'],
      ['â', 'a'], ['ầ', 'a'], ['ấ', 'a'], ['ậ', 'a'], ['ẩ', 'a'], ['ẫ', 'a'],
      ['ă', 'a'], ['ằ', 'a'], ['ắ', 'a'], ['ặ', 'a'], ['ẳ', 'a'], ['ẵ', 'a'],
      ['è', 'e'], ['é', 'e'], ['ẹ', 'e'], ['ẻ', 'e'], ['ẽ', 'e'],
      ['ê', 'e'], ['ề', 'e'], ['ế', 'e'], ['ệ', 'e'], ['ể', 'e'], ['ễ', 'e'],
      ['ì', 'i'], ['í', 'i'], ['ị', 'i'], ['ỉ', 'i'], ['ĩ', 'i'],
      ['ò', 'o'], ['ó', 'o'], ['ọ', 'o'], ['ỏ', 'o'], ['õ', 'o'],
      ['ô', 'o'], ['ồ', 'o'], ['ố', 'o'], ['ộ', 'o'], ['ổ', 'o'], ['ỗ', 'o'],
      ['ơ', 'o'], ['ờ', 'o'], ['ớ', 'o'], ['ợ', 'o'], ['ở', 'o'], ['ỡ', 'o'],
      ['ù', 'u'], ['ú', 'u'], ['ụ', 'u'], ['ủ', 'u'], ['ũ', 'u'],
      ['ư', 'u'], ['ừ', 'u'], ['ứ', 'u'], ['ự', 'u'], ['ử', 'u'], ['ữ', 'u'],
      ['ỳ', 'y'], ['ý', 'y'], ['ỵ', 'y'], ['ỷ', 'y'], ['ỹ', 'y'],
      ['đ', 'd'],
      ['À', 'A'], ['Á', 'A'], ['Ạ', 'A'], ['Ả', 'A'], ['Ã', 'A'],
      ['Â', 'A'], ['Ầ', 'A'], ['Ấ', 'A'], ['Ậ', 'A'], ['Ẩ', 'A'], ['Ẫ', 'A'],
      ['Ă', 'A'], ['Ằ', 'A'], ['Ắ', 'A'], ['Ặ', 'A'], ['Ẳ', 'A'], ['Ẵ', 'A'],
      ['È', 'E'], ['É', 'E'], ['Ẹ', 'E'], ['Ẻ', 'E'], ['Ẽ', 'E'],
      ['Ê', 'E'], ['Ề', 'E'], ['Ế', 'E'], ['Ệ', 'E'], ['Ể', 'E'], ['Ễ', 'E'],
      ['Ì', 'I'], ['Í', 'I'], ['Ị', 'I'], ['Ỉ', 'I'], ['Ĩ', 'I'],
      ['Ò', 'O'], ['Ó', 'O'], ['Ọ', 'O'], ['Ỏ', 'O'], ['Õ', 'O'],
      ['Ô', 'O'], ['Ồ', 'O'], ['Ố', 'O'], ['Ộ', 'O'], ['Ổ', 'O'], ['Ỗ', 'O'],
      ['Ơ', 'O'], ['Ờ', 'O'], ['Ớ', 'O'], ['Ợ', 'O'], ['Ở', 'O'], ['Ỡ', 'O'],
      ['Ù', 'U'], ['Ú', 'U'], ['Ụ', 'U'], ['Ủ', 'U'], ['Ũ', 'U'],
      ['Ư', 'U'], ['Ừ', 'U'], ['Ứ', 'U'], ['Ự', 'U'], ['Ử', 'U'], ['Ữ', 'U'],
      ['Ỳ', 'Y'], ['Ý', 'Y'], ['Ỵ', 'Y'], ['Ỷ', 'Y'], ['Ỹ', 'Y'],
      ['Đ', 'D'],
    ]

    let sql = columnName
    for (const [accented, plain] of replacements) {
      sql = `REPLACE(${sql}, '${accented}', '${plain}')`
    }
    return sql
  }

  private async findWithRawQuery(
    client: any,
    pagination: ExamPaginationOptions,
    filters: ExamFilterOptions,
  ): Promise<ExamListResult> {
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const sortBy = pagination.sortBy || 'createdAt'
    const sortOrder = pagination.sortOrder || 'desc'
    const skip = (page - 1) * limit

    const conditions: string[] = []
    const params: any[] = []

    if (filters.subjectId !== undefined) {
      conditions.push('e.subject_id = ?')
      params.push(filters.subjectId)
    }

    if (filters.grade !== undefined) {
      conditions.push('e.grade = ?')
      params.push(filters.grade)
    }

    if (filters.typeOfExam !== undefined) {
      conditions.push('e.type_of_exam = ?')
      params.push(filters.typeOfExam)
    }

    if (filters.visibility) {
      conditions.push('e.visibility = ?')
      params.push(filters.visibility)
    } else if (filters.excludeVisibility) {
      conditions.push('e.visibility <> ?')
      params.push(filters.excludeVisibility)
    }

    if (filters.createdBy !== undefined) {
      conditions.push('e.created_by = ?')
      params.push(filters.createdBy)
    }

    if (filters.chapterIds !== undefined && filters.chapterIds.length > 0) {
      const placeholders = filters.chapterIds.map(() => '?').join(', ')
      conditions.push(`EXISTS (
        SELECT 1
        FROM questions_exams qe
        INNER JOIN questions_chapters qc ON qc.question_id = qe.question_id
        WHERE qe.exam_id = e.exam_id
          AND qc.chapter_id IN (${placeholders})
      )`)
      params.push(...filters.chapterIds)
    }

    if (filters.search) {
      const searchPattern = `%${filters.search}%`
      const normalizedSearch = `%${TextSearchUtil.removeVietnameseAccents(filters.search)}%`

      const titleNoAccent = this.buildRemoveAccentsSQL('e.title')
      const descriptionNoAccent = this.buildRemoveAccentsSQL('e.description')

      conditions.push(`(
        LOWER(e.title) LIKE LOWER(?) OR
        LOWER(IFNULL(e.description, '')) LIKE LOWER(?) OR
        LOWER(${titleNoAccent}) LIKE LOWER(?) OR
        LOWER(IFNULL(${descriptionNoAccent}, '')) LIKE LOWER(?)
      )`)

      params.push(searchPattern, searchPattern, normalizedSearch, normalizedSearch)
    }

    const columnMap: Record<string, string> = {
      examId: 'e.exam_id',
      title: 'e.title',
      grade: 'e.grade',
      createdAt: 'e.created_at',
      updatedAt: 'e.updated_at',
    }
    const orderColumn = columnMap[sortBy] || 'e.created_at'
    const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    const orderByClause = `ORDER BY ${orderColumn} ${safeSortOrder}`

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const baseFrom = `FROM exams e ${whereClause}`

    const countQuery = `SELECT COUNT(*) as total ${baseFrom}`
    const idsQuery = `SELECT e.exam_id ${baseFrom} ${orderByClause} LIMIT ? OFFSET ?`

    const [countResult, idsResult] = await Promise.all([
      client.$queryRawUnsafe(countQuery, ...params) as Promise<Array<{ total: number | bigint }>>,
      client.$queryRawUnsafe(idsQuery, ...params, limit, skip) as Promise<Array<{ exam_id: number }>>,
    ])

    const totalValue = countResult[0]?.total ?? 0
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : totalValue
    const ids = idsResult.map((row) => row.exam_id)

    const exams = ids.length === 0
      ? []
      : await client.exam.findMany({
          where: { examId: { in: ids } },
          include: {
            subject: true,
            admin: {
              include: {
                user: true,
              },
            },
            competitions: {
              orderBy: { createdAt: 'desc' },
              include: {
                admin: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            _count: {
              select: {
                questions: true,
              },
            },
          },
        })

    const idOrder = new Map(ids.map((id, index) => [id, index]))
    exams.sort((a: any, b: any) => (idOrder.get(a.examId) ?? 0) - (idOrder.get(b.examId) ?? 0))

    return {
      exams: ExamMapper.toDomainExams(exams),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async countQuestionsByExamId(examId: number, txClient?: any): Promise<number> {
    const client = txClient || this.prisma

    const count = await client.questionExam.count({
      where: {
        examId: examId,
      },
    })

    return count
  }

  async countPublishedByType(txClient?: any): Promise<PublishedExamTypeCount[]> {
    const client = txClient || this.prisma

    const result = await client.exam.groupBy({
      by: ['typeOfExam'],
      where: {
        visibility: ExamVisibility.PUBLISHED,
      },
      _count: {
        _all: true,
      },
    })

    return result.map((item: { typeOfExam: TypeOfExam | null; _count: { _all: number } }) => ({
      typeOfExam: item.typeOfExam,
      total: item._count._all,
    }))
  }
}
