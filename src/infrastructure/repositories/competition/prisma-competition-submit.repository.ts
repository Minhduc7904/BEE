// src/infrastructure/repositories/competition/prisma-competition-submit.repository.ts
import { BadRequestException, Injectable } from '@nestjs/common'
import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import {
  ICompetitionSubmitRepository,
  CreateCompetitionSubmitData,
  UpdateCompetitionSubmitData,
  GradeCompetitionSubmitData,
  CompetitionSubmitFilterOptions,
  CompetitionSubmitPaginationOptions,
  CompetitionSubmitListResult,
  CompetitionSubmitScoreExportResult,
} from '../../../domain/repositories/competition-submit.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { CompetitionSubmitMapper } from '../../mappers/competition/competition-submit.mapper'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import { TextSearchUtil } from '../../../shared/utils/text-search.util'
import { Visibility } from '../../../shared/enums'

@Injectable()
export class PrismaCompetitionSubmitRepository implements ICompetitionSubmitRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  private buildStudentHistoryOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): any[] {
    const safeSortBy =
      sortBy === 'createdAt' ||
      sortBy === 'attemptNumber' ||
      sortBy === 'totalPoints' ||
      sortBy === 'timeSpentSeconds' ||
      sortBy === 'submittedAt'
        ? sortBy
        : 'createdAt'

    if (safeSortBy === 'attemptNumber') {
      return [{ attemptNumber: sortOrder }, { submittedAt: 'desc' }, { competitionSubmitId: 'desc' }]
    }

    if (safeSortBy === 'totalPoints') {
      return [
        { totalPoints: sortOrder },
        { timeSpentSeconds: 'asc' },
        { submittedAt: 'asc' },
        { competitionSubmitId: 'asc' },
      ]
    }

    if (safeSortBy === 'timeSpentSeconds') {
      return [{ timeSpentSeconds: sortOrder }, { submittedAt: 'asc' }, { competitionSubmitId: 'asc' }]
    }

    if (safeSortBy === 'createdAt') {
      return [{ createdAt: sortOrder }, { competitionSubmitId: sortOrder }]
    }

    return [{ submittedAt: sortOrder }, { competitionSubmitId: sortOrder }]
  }

  async create(data: CreateCompetitionSubmitData, txClient?: any): Promise<CompetitionSubmit> {
    const client = txClient || this.prisma

    const created = await client.competitionSubmit.create({
      data: {
        competitionId: data.competitionId,
        studentId: data.studentId,
        attemptNumber: data.attemptNumber,
        status: data.status,
        startedAt: data.startedAt,
        submittedAt: data.submittedAt ?? null,
        gradedAt: data.gradedAt ?? null,
        totalPoints: data.totalPoints ?? null,
        maxPoints: data.maxPoints ?? null,
        timeSpentSeconds: data.timeSpentSeconds ?? null,
        graderId: data.graderId ?? null,
        feedback: data.feedback ?? null,
        metadata: data.metadata ?? null,
      },
      include: {
        competition: {
          include: {
            exam: true,
            admin: {
              include: {
                user: true,
              },
            },
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        competitionAnswers: {
          include: {
            question: true,
          },
        },
      },
    })

    return CompetitionSubmitMapper.toDomainCompetitionSubmit(created)!
  }

  async findById(id: number, txClient?: any): Promise<CompetitionSubmit | null> {
    const client = txClient || this.prisma

    const submit = await client.competitionSubmit.findUnique({
      where: { competitionSubmitId: id },
      include: {
        competition: {
          include: {
            exam: true,
            admin: {
              include: {
                user: true,
              },
            },
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        competitionAnswers: {
          include: {
            question: true,
          },
        },
      },
    })

    if (!submit) return null

    return CompetitionSubmitMapper.toDomainCompetitionSubmit(submit)
  }

  async update(id: number, data: UpdateCompetitionSubmitData, txClient?: any): Promise<CompetitionSubmit> {
    const client = txClient || this.prisma

    const updateData: any = {}

    if (data.status !== undefined) updateData.status = data.status
    if (data.submittedAt !== undefined) updateData.submittedAt = data.submittedAt
    if (data.gradedAt !== undefined) updateData.gradedAt = data.gradedAt
    if (data.totalPoints !== undefined) updateData.totalPoints = data.totalPoints
    if (data.maxPoints !== undefined) updateData.maxPoints = data.maxPoints
    if (data.timeSpentSeconds !== undefined) updateData.timeSpentSeconds = data.timeSpentSeconds
    if (data.graderId !== undefined) updateData.graderId = data.graderId
    if (data.feedback !== undefined) updateData.feedback = data.feedback
    if (data.metadata !== undefined) updateData.metadata = data.metadata

    const updated = await client.competitionSubmit.update({
      where: { competitionSubmitId: id },
      data: updateData,
      include: {
        competition: {
          include: {
            exam: true,
            admin: {
              include: {
                user: true,
              },
            },
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        competitionAnswers: {
          include: {
            question: true,
          },
        },
      },
    })

    return CompetitionSubmitMapper.toDomainCompetitionSubmit(updated)!
  }

  async delete(id: number, txClient?: any): Promise<void> {
    const client = txClient || this.prisma

    await client.competitionSubmit.delete({
      where: { competitionSubmitId: id },
    })
  }

  async findAll(txClient?: any): Promise<CompetitionSubmit[]> {
    const client = txClient || this.prisma

    const submits = await client.competitionSubmit.findMany({
      where: { student: { user: { isActive: true } } },
      include: {
        competition: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    })

    return submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean)
  }

  async findAllInProgressWithCompetition(txClient?: any): Promise<CompetitionSubmit[]> {
    const client = txClient || this.prisma

    const submits = await client.competitionSubmit.findMany({
      where: { status: CompetitionSubmitStatus.IN_PROGRESS },
      include: {
        competition: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    })

    return submits.map((submit: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(submit)).filter(Boolean)
  }

  async findAllWithPagination(
    pagination: CompetitionSubmitPaginationOptions,
    filters?: CompetitionSubmitFilterOptions,
    txClient?: any,
  ): Promise<CompetitionSubmitListResult> {
    const client = txClient || this.prisma

    if (filters?.search) {
      return this.findWithRawQuery(client, pagination, filters)
    }

    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const sortBy = pagination.sortBy || 'createdAt'
    const sortOrder = pagination.sortOrder || 'desc'
    const skip = (page - 1) * limit

    const where = this.buildWhereClause(filters)
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [prismaSubmits, total] = await Promise.all([
      client.competitionSubmit.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          competition: true,
          student: {
            include: {
              user: true,
            },
          },
        },
      }),
      client.competitionSubmit.count({ where }),
    ])

    const competitionSubmits = prismaSubmits
      .map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s))
      .filter(Boolean)
    const totalPages = Math.ceil(total / limit)

    return {
      competitionSubmits,
      total,
      page,
      limit,
      totalPages,
    }
  }

  private async findWithRawQuery(
    client: any,
    pagination: CompetitionSubmitPaginationOptions,
    filters: CompetitionSubmitFilterOptions,
  ): Promise<CompetitionSubmitListResult> {
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const sortBy = pagination.sortBy || 'createdAt'
    const sortOrder = pagination.sortOrder || 'desc'
    const skip = (page - 1) * limit

    const conditions: string[] = filters.isActive === undefined ? ['u.is_active = true'] : []
    const params: any[] = []

    if (filters.competitionId !== undefined) {
      conditions.push('cs.competition_id = ?')
      params.push(filters.competitionId)
    }

    if (filters.studentId !== undefined) {
      conditions.push('cs.student_id = ?')
      params.push(filters.studentId)
    }

    if (filters.grade !== undefined) {
      conditions.push('s.grade = ?')
      params.push(filters.grade)
    }

    if (filters.highSchoolGraduationYear !== undefined) {
      conditions.push('s.high_school_graduation_year = ?')
      params.push(filters.highSchoolGraduationYear)
    }

    if (filters.isActive !== undefined) {
      conditions.push('u.is_active = ?')
      params.push(filters.isActive ? 1 : 0)
    }

    if (filters.hasParentZaloId !== undefined) {
      conditions.push(filters.hasParentZaloId ? 's.parent_zalo_id IS NOT NULL' : 's.parent_zalo_id IS NULL')
    }

    if (filters.classIds?.length) {
      const placeholders = filters.classIds.map(() => '?').join(', ')
      conditions.push(`EXISTS (
                SELECT 1 FROM classes_students cls
                WHERE cls.student_id = s.student_id
                  AND cls.class_id IN (${placeholders})
            )`)
      params.push(...filters.classIds)
    }

    if (filters.attemptNumber !== undefined) {
      conditions.push('cs.attempt_number = ?')
      params.push(filters.attemptNumber)
    }

    if (filters.startedFrom) {
      conditions.push('cs.started_at >= ?')
      params.push(filters.startedFrom)
    }

    if (filters.startedTo) {
      conditions.push('cs.started_at <= ?')
      params.push(filters.startedTo)
    }

    if (filters.submittedFrom) {
      conditions.push('cs.submitted_at >= ?')
      params.push(filters.submittedFrom)
    }

    if (filters.submittedTo) {
      conditions.push('cs.submitted_at <= ?')
      params.push(filters.submittedTo)
    }

    if (filters.isGraded !== undefined) {
      if (filters.isGraded) {
        conditions.push('cs.status = ?')
        params.push(CompetitionSubmitStatus.GRADED)
      } else {
        conditions.push('cs.status <> ?')
        params.push(CompetitionSubmitStatus.GRADED)
      }
    } else if (filters.status) {
      conditions.push('cs.status = ?')
      params.push(filters.status)
    }

    if (filters.search?.trim()) {
      const searchText = filters.search.trim()
      const searchPattern = `%${searchText}%`
      const normalizedSearch = `%${TextSearchUtil.removeVietnameseAccents(searchText)}%`
      const normalizedPhoneSearch = `%${searchText.replace(/[\s\-.]/g, '')}%`

      const firstNameNoAccent = this.buildRemoveAccentsSQL('u.first_name')
      const lastNameNoAccent = this.buildRemoveAccentsSQL('u.last_name')
      const fullNameNoAccent = this.buildRemoveAccentsSQL(`CONCAT(u.last_name, ' ', u.first_name)`)
      const reverseFullNameNoAccent = this.buildRemoveAccentsSQL(`CONCAT(u.first_name, ' ', u.last_name)`)

      conditions.push(`(
                LOWER(u.first_name) LIKE LOWER(?) OR
                LOWER(u.last_name) LIKE LOWER(?) OR
                LOWER(CONCAT(u.last_name, ' ', u.first_name)) LIKE LOWER(?) OR
                LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER(?) OR
                LOWER(IFNULL(s.student_phone, '')) LIKE LOWER(?) OR
                LOWER(IFNULL(s.parent_phone, '')) LIKE LOWER(?) OR
                LOWER(${firstNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${lastNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${fullNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${reverseFullNameNoAccent}) LIKE LOWER(?) OR
                LOWER(REPLACE(REPLACE(REPLACE(IFNULL(s.student_phone, ''), ' ', ''), '-', ''), '.', '')) LIKE LOWER(?) OR
                LOWER(REPLACE(REPLACE(REPLACE(IFNULL(s.parent_phone, ''), ' ', ''), '-', ''), '.', '')) LIKE LOWER(?)
            )`)

      params.push(searchPattern, searchPattern, searchPattern, searchPattern)
      params.push(searchPattern, searchPattern)
      params.push(normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch)
      params.push(normalizedPhoneSearch, normalizedPhoneSearch)
    }

    const columnMap: Record<string, string> = {
      createdAt: 'cs.created_at',
      updatedAt: 'cs.updated_at',
      startedAt: 'cs.started_at',
      submittedAt: 'cs.submitted_at',
      gradedAt: 'cs.graded_at',
      status: 'cs.status',
      attemptNumber: 'cs.attempt_number',
      totalPoints: 'cs.total_points',
      maxPoints: 'cs.max_points',
      timeSpentSeconds: 'cs.time_spent_seconds',
      competitionId: 'cs.competition_id',
      studentId: 'cs.student_id',
    }
    const orderColumn = columnMap[sortBy] || 'cs.created_at'
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const baseFrom = `
            FROM competition_submits cs
            INNER JOIN students s ON cs.student_id = s.student_id
            INNER JOIN users u ON s.user_id = u.user_id
            ${whereClause}
        `

    const countQuery = `SELECT COUNT(*) as total ${baseFrom}`
    const idsQuery = `
            SELECT cs.competition_submit_id
            ${baseFrom}
            ORDER BY ${orderColumn} ${orderDirection}
            LIMIT ? OFFSET ?
        `

    const [countResult, idsResult] = await Promise.all([
      client.$queryRawUnsafe(countQuery, ...params) as Promise<Array<{ total: bigint | number }>>,
      client.$queryRawUnsafe(idsQuery, ...params, limit, skip) as Promise<Array<{ competition_submit_id: number }>>,
    ])

    const total = Number(countResult[0]?.total ?? 0)
    const ids = idsResult.map((row) => row.competition_submit_id)

    const prismaSubmits =
      ids.length === 0
        ? []
        : await client.competitionSubmit.findMany({
            where: { competitionSubmitId: { in: ids } },
            include: {
              competition: true,
              student: {
                include: {
                  user: true,
                },
              },
            },
          })

    const idOrder = new Map(ids.map((id, index) => [id, index]))
    prismaSubmits.sort(
      (a: any, b: any) => (idOrder.get(a.competitionSubmitId) ?? 0) - (idOrder.get(b.competitionSubmitId) ?? 0),
    )

    const competitionSubmits = prismaSubmits
      .map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s))
      .filter(Boolean)

    return {
      competitionSubmits,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  private buildRemoveAccentsSQL(columnName: string): string {
    const replacements = [
      ['à', 'a'],
      ['á', 'a'],
      ['ạ', 'a'],
      ['ả', 'a'],
      ['ã', 'a'],
      ['â', 'a'],
      ['ầ', 'a'],
      ['ấ', 'a'],
      ['ậ', 'a'],
      ['ẩ', 'a'],
      ['ẫ', 'a'],
      ['ă', 'a'],
      ['ằ', 'a'],
      ['ắ', 'a'],
      ['ặ', 'a'],
      ['ẳ', 'a'],
      ['ẵ', 'a'],
      ['è', 'e'],
      ['é', 'e'],
      ['ẹ', 'e'],
      ['ẻ', 'e'],
      ['ẽ', 'e'],
      ['ê', 'e'],
      ['ề', 'e'],
      ['ế', 'e'],
      ['ệ', 'e'],
      ['ể', 'e'],
      ['ễ', 'e'],
      ['ì', 'i'],
      ['í', 'i'],
      ['ị', 'i'],
      ['ỉ', 'i'],
      ['ĩ', 'i'],
      ['ò', 'o'],
      ['ó', 'o'],
      ['ọ', 'o'],
      ['ỏ', 'o'],
      ['õ', 'o'],
      ['ô', 'o'],
      ['ồ', 'o'],
      ['ố', 'o'],
      ['ộ', 'o'],
      ['ổ', 'o'],
      ['ỗ', 'o'],
      ['ơ', 'o'],
      ['ờ', 'o'],
      ['ớ', 'o'],
      ['ợ', 'o'],
      ['ở', 'o'],
      ['ỡ', 'o'],
      ['ù', 'u'],
      ['ú', 'u'],
      ['ụ', 'u'],
      ['ủ', 'u'],
      ['ũ', 'u'],
      ['ư', 'u'],
      ['ừ', 'u'],
      ['ứ', 'u'],
      ['ự', 'u'],
      ['ử', 'u'],
      ['ữ', 'u'],
      ['ỳ', 'y'],
      ['ý', 'y'],
      ['ỵ', 'y'],
      ['ỷ', 'y'],
      ['ỹ', 'y'],
      ['đ', 'd'],
      ['À', 'A'],
      ['Á', 'A'],
      ['Ạ', 'A'],
      ['Ả', 'A'],
      ['Ã', 'A'],
      ['Â', 'A'],
      ['Ầ', 'A'],
      ['Ấ', 'A'],
      ['Ậ', 'A'],
      ['Ẩ', 'A'],
      ['Ẫ', 'A'],
      ['Ă', 'A'],
      ['Ằ', 'A'],
      ['Ắ', 'A'],
      ['Ặ', 'A'],
      ['Ẳ', 'A'],
      ['Ẵ', 'A'],
      ['È', 'E'],
      ['É', 'E'],
      ['Ẹ', 'E'],
      ['Ẻ', 'E'],
      ['Ẽ', 'E'],
      ['Ê', 'E'],
      ['Ề', 'E'],
      ['Ế', 'E'],
      ['Ệ', 'E'],
      ['Ể', 'E'],
      ['Ễ', 'E'],
      ['Ì', 'I'],
      ['Í', 'I'],
      ['Ị', 'I'],
      ['Ỉ', 'I'],
      ['Ĩ', 'I'],
      ['Ò', 'O'],
      ['Ó', 'O'],
      ['Ọ', 'O'],
      ['Ỏ', 'O'],
      ['Õ', 'O'],
      ['Ô', 'O'],
      ['Ồ', 'O'],
      ['Ố', 'O'],
      ['Ộ', 'O'],
      ['Ổ', 'O'],
      ['Ỗ', 'O'],
      ['Ơ', 'O'],
      ['Ờ', 'O'],
      ['Ớ', 'O'],
      ['Ợ', 'O'],
      ['Ở', 'O'],
      ['Ỡ', 'O'],
      ['Ù', 'U'],
      ['Ú', 'U'],
      ['Ụ', 'U'],
      ['Ủ', 'U'],
      ['Ũ', 'U'],
      ['Ư', 'U'],
      ['Ừ', 'U'],
      ['Ứ', 'U'],
      ['Ự', 'U'],
      ['Ử', 'U'],
      ['Ữ', 'U'],
      ['Ỳ', 'Y'],
      ['Ý', 'Y'],
      ['Ỵ', 'Y'],
      ['Ỷ', 'Y'],
      ['Ỹ', 'Y'],
      ['Đ', 'D'],
    ]

    let sql = columnName
    for (const [accented, plain] of replacements) {
      sql = `REPLACE(${sql}, '${accented}', '${plain}')`
    }
    return sql
  }

  async findByFilters(
    filters: CompetitionSubmitFilterOptions,
    pagination?: CompetitionSubmitPaginationOptions,
    txClient?: any,
  ): Promise<CompetitionSubmitListResult> {
    return this.findAllWithPagination(pagination || {}, filters, txClient)
  }

  async findForScoreExport(
    filters: CompetitionSubmitFilterOptions,
    pagination?: CompetitionSubmitPaginationOptions,
    txClient?: any,
  ): Promise<CompetitionSubmitScoreExportResult> {
    const client = txClient || this.prisma
    const page = pagination?.page || 1
    const limit = Math.min(10000, pagination?.limit || 10000)

    const listResult = await this.findAllWithPagination(
      {
        page,
        limit,
        sortBy: pagination?.sortBy || 'startedAt',
        sortOrder: pagination?.sortOrder || 'desc',
      },
      filters,
      client,
    )

    const ids = listResult.competitionSubmits.map((submit) => submit.competitionSubmitId)
    if (ids.length === 0) {
      return {
        competitionSubmits: [],
        questions: [],
      }
    }

    const prismaSubmits = await client.competitionSubmit.findMany({
      where: { competitionSubmitId: { in: ids } },
      include: {
        competition: true,
        student: {
          include: {
            user: true,
            classStudents: {
              include: {
                courseClass: true,
              },
            },
          },
        },
        competitionAnswers: {
          include: {
            question: true,
          },
        },
      },
    })

    const idOrder = new Map(ids.map((id, index) => [id, index]))
    prismaSubmits.sort(
      (a: any, b: any) => (idOrder.get(a.competitionSubmitId) ?? 0) - (idOrder.get(b.competitionSubmitId) ?? 0),
    )

    const examIds = Array.from(
      new Set(
        prismaSubmits
          .map((submit: any) => submit.competition?.examId)
          .filter((examId: number | null | undefined): examId is number => examId !== null && examId !== undefined),
      ),
    )

    let orderedQuestions: Array<{ questionId: number; order: number }> = []
    if (examIds.length > 0) {
      const questionExams = await client.questionExam.findMany({
        where: { examId: { in: examIds } },
        select: {
          questionId: true,
          order: true,
          examId: true,
        },
        orderBy: [{ examId: 'asc' }, { order: 'asc' }, { questionId: 'asc' }],
      })

      const seen = new Set<number>()
      orderedQuestions = questionExams
        .filter((questionExam: any) => {
          if (seen.has(questionExam.questionId)) {
            return false
          }
          seen.add(questionExam.questionId)
          return true
        })
        .map((questionExam: any, index: number) => ({
          questionId: questionExam.questionId,
          order: questionExam.order ?? index + 1,
        }))
    }

    if (orderedQuestions.length === 0) {
      const seen = new Set<number>()
      orderedQuestions = prismaSubmits
        .flatMap((submit: any) => submit.competitionAnswers || [])
        .filter((answer: any) => {
          if (seen.has(answer.questionId)) {
            return false
          }
          seen.add(answer.questionId)
          return true
        })
        .sort((left: any, right: any) => left.questionId - right.questionId)
        .map((answer: any, index: number) => ({
          questionId: answer.questionId,
          order: index + 1,
        }))
    }

    return {
      competitionSubmits: prismaSubmits,
      questions: orderedQuestions,
    }
  }

  async findByCompetition(competitionId: number, txClient?: any): Promise<CompetitionSubmit[]> {
    const client = txClient || this.prisma

    const submits = await client.competitionSubmit.findMany({
      where: { competitionId, student: { user: { isActive: true } } },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        competitionAnswers: true,
      },
      orderBy: { startedAt: 'desc' },
    })

    return submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean)
  }

  async findByStudent(studentId: number, txClient?: any): Promise<CompetitionSubmit[]> {
    const client = txClient || this.prisma

    const submits = await client.competitionSubmit.findMany({
      where: { studentId, student: { user: { isActive: true } } },
      include: {
        competition: true,
        competitionAnswers: true,
      },
      orderBy: { startedAt: 'desc' },
    })

    return submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean)
  }

  async findByCompetitionAndStudent(
    competitionId: number,
    studentId: number,
    txClient?: any,
  ): Promise<CompetitionSubmit[]> {
    const client = txClient || this.prisma

    const submits = await client.competitionSubmit.findMany({
      where: {
        competitionId,
        studentId,
        student: { user: { isActive: true } },
      },
      include: {
        competition: true,
        student: {
          include: {
            user: true,
          },
        },
        competitionAnswers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { attemptNumber: 'asc' },
    })

    return submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean)
  }

  async findLatestAttempt(competitionId: number, studentId: number, txClient?: any): Promise<CompetitionSubmit | null> {
    const client = txClient || this.prisma

    const submit = await client.competitionSubmit.findFirst({
      where: {
        competitionId,
        studentId,
        student: { user: { isActive: true } },
      },
      include: {
        competition: true,
        student: {
          include: {
            user: true,
          },
        },
        competitionAnswers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { attemptNumber: 'desc' },
    })

    if (!submit) return null

    return CompetitionSubmitMapper.toDomainCompetitionSubmit(submit)
  }

  async findByAttempt(
    competitionId: number,
    studentId: number,
    attemptNumber: number,
    txClient?: any,
  ): Promise<CompetitionSubmit | null> {
    const client = txClient || this.prisma

    const submit = await client.competitionSubmit.findUnique({
      where: {
        competitionId_studentId_attemptNumber: {
          competitionId,
          studentId,
          attemptNumber,
        },
      },
      include: {
        competition: {
          include: {
            exam: true,
            admin: {
              include: {
                user: true,
              },
            },
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        competitionAnswers: {
          include: {
            question: true,
          },
        },
      },
    })

    if (!submit) return null

    return CompetitionSubmitMapper.toDomainCompetitionSubmit(submit)
  }

  async grade(id: number, data: GradeCompetitionSubmitData, txClient?: any): Promise<CompetitionSubmit> {
    const client = txClient || this.prisma

    const updated = await client.competitionSubmit.update({
      where: { competitionSubmitId: id },
      data: {
        status: CompetitionSubmitStatus.GRADED,
        totalPoints: data.totalPoints,
        maxPoints: data.maxPoints,
        gradedAt: data.gradedAt,
        metadata: data.metadata,
      },
      include: {
        competition: {
          include: {
            exam: true,
            admin: {
              include: {
                user: true,
              },
            },
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        competitionAnswers: {
          include: {
            question: true,
          },
        },
      },
    })

    return CompetitionSubmitMapper.toDomainCompetitionSubmit(updated)!
  }

  async count(filters?: CompetitionSubmitFilterOptions, txClient?: any): Promise<number> {
    const client = txClient || this.prisma
    const where = this.buildWhereClause(filters)
    return client.competitionSubmit.count({ where })
  }

  async countByCompetition(competitionId: number, txClient?: any): Promise<number> {
    const client = txClient || this.prisma
    return client.competitionSubmit.count({
      where: { competitionId, student: { user: { isActive: true } } },
    })
  }

  async countByCompetitions(competitionIds: number[], txClient?: any): Promise<Map<number, number>> {
    if (competitionIds.length === 0) return new Map()
    const client = txClient || this.prisma

    const grouped = await client.competitionSubmit.groupBy({
      by: ['competitionId'],
      where: { competitionId: { in: competitionIds }, student: { user: { isActive: true } } },
      _count: { competitionId: true },
    })

    const result = new Map<number, number>()
    for (const row of grouped) {
      result.set(row.competitionId, row._count.competitionId)
    }
    return result
  }

  async countByStudent(studentId: number, txClient?: any): Promise<number> {
    const client = txClient || this.prisma
    return client.competitionSubmit.count({
      where: { studentId, student: { user: { isActive: true } } },
    })
  }

  async countByStatus(status: CompetitionSubmitStatus, competitionId?: number, txClient?: any): Promise<number> {
    const client = txClient || this.prisma
    const where: any = { status, student: { user: { isActive: true } } }
    if (competitionId !== undefined) {
      where.competitionId = competitionId
    }
    return client.competitionSubmit.count({ where })
  }

  async countGradedSubmits(competitionId?: number, txClient?: any): Promise<number> {
    const client = txClient || this.prisma
    const where: any = {
      status: CompetitionSubmitStatus.GRADED,
      student: { user: { isActive: true } },
    }
    if (competitionId !== undefined) {
      where.competitionId = competitionId
    }
    return client.competitionSubmit.count({ where })
  }

  async countUngradedSubmits(competitionId?: number, txClient?: any): Promise<number> {
    const client = txClient || this.prisma
    const where: any = {
      status: {
        in: [CompetitionSubmitStatus.SUBMITTED, CompetitionSubmitStatus.IN_PROGRESS],
      },
      student: { user: { isActive: true } },
    }
    if (competitionId !== undefined) {
      where.competitionId = competitionId
    }
    return client.competitionSubmit.count({ where })
  }

  async getLeaderboard(competitionId: number, limit: number = 10, txClient?: any): Promise<CompetitionSubmit[]> {
    const client = txClient || this.prisma

    const submits = await client.competitionSubmit.findMany({
      where: {
        competitionId,
        status: CompetitionSubmitStatus.SUBMITTED,
        totalPoints: { not: null },
        student: { user: { isActive: true } },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        competition: true,
      },
      orderBy: [{ totalPoints: 'desc' }, { submittedAt: 'asc' }],
      take: limit,
    })

    return submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean)
  }

  async getPaginatedLeaderboard(
    competitionId: number,
    page: number = 1,
    limit: number = 10,
    txClient?: any,
  ): Promise<{ submits: CompetitionSubmit[]; total: number }> {
    const client = txClient || this.prisma

    const skip = (page - 1) * limit

    const where = {
      competitionId,
      status: CompetitionSubmitStatus.SUBMITTED,
      totalPoints: { not: null },
      student: { user: { isActive: true } },
    }

    const [submits, total] = await Promise.all([
      client.competitionSubmit.findMany({
        where,
        include: {
          student: {
            include: {
              user: true,
            },
          },
          competition: true,
        },
        orderBy: [
          { totalPoints: 'desc' },
          { timeSpentSeconds: 'asc' }, // Nếu điểm bằng nhau, ưu tiên người làm nhanh hơn
          { submittedAt: 'asc' },
        ],
        skip,
        take: limit,
      }),
      client.competitionSubmit.count({ where }),
    ])

    return {
      submits: submits.map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s)).filter(Boolean),
      total,
    }
  }

  /**
   * Lấy chi tiết đầy đủ bài nộp cho admin:
   * bao gồm competition, student, và mỗi answer kèm đầy đủ
   * question + tất cả statements (có isCorrect).
   */
  async findByIdWithFullDetails(id: number, txClient?: any): Promise<CompetitionSubmit | null> {
    const client = txClient || this.prisma

    const submit = await client.competitionSubmit.findUnique({
      where: { competitionSubmitId: id },
      include: {
        competition: {
          include: {
            exam: true,
            admin: {
              include: {
                user: true,
              },
            },
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        competitionAnswers: {
          orderBy: { questionId: 'asc' },
          include: {
            question: {
              include: {
                statements: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!submit) return null

    return CompetitionSubmitMapper.toDomainCompetitionSubmit(submit)
  }

  async findStudentHistory(
    competitionId: number,
    studentId: number,
    pagination: CompetitionSubmitPaginationOptions,
    txClient?: any,
  ): Promise<CompetitionSubmitListResult> {
    const client = txClient || this.prisma

    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const sortBy = pagination.sortBy || 'createdAt'
    const sortOrder = pagination.sortOrder || 'desc'
    const skip = (page - 1) * limit

    const where: any = {
      competitionId,
      studentId,
      status: {
        notIn: [CompetitionSubmitStatus.IN_PROGRESS, CompetitionSubmitStatus.ABANDONED],
      },
    }

    const orderBy = this.buildStudentHistoryOrderBy(sortBy, sortOrder)

    const [prismaSubmits, total] = await Promise.all([
      client.competitionSubmit.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          competition: true,
          student: {
            include: { user: true },
          },
        },
      }),
      client.competitionSubmit.count({ where }),
    ])

    const competitionSubmits = prismaSubmits
      .map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s))
      .filter(Boolean)
    const totalPages = Math.ceil(total / limit)

    return {
      competitionSubmits,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async findPublicStudentHistory(
    studentId: number,
    pagination: CompetitionSubmitPaginationOptions,
    txClient?: any,
  ): Promise<CompetitionSubmitListResult> {
    const client = txClient || this.prisma

    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const sortBy = pagination.sortBy || 'createdAt'
    const sortOrder = pagination.sortOrder || 'desc'
    const skip = (page - 1) * limit

    const where: any = {
      studentId,
      status: {
        notIn: [CompetitionSubmitStatus.IN_PROGRESS, CompetitionSubmitStatus.ABANDONED],
      },
      competition: {
        visibility: Visibility.PUBLISHED,
      },
    }

    const orderBy = this.buildStudentHistoryOrderBy(sortBy, sortOrder)

    const [prismaSubmits, total] = await Promise.all([
      client.competitionSubmit.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          competition: true,
          student: {
            include: { user: true },
          },
        },
      }),
      client.competitionSubmit.count({ where }),
    ])

    const competitionSubmits = prismaSubmits
      .map((s: any) => CompetitionSubmitMapper.toDomainCompetitionSubmit(s))
      .filter(Boolean)
    const totalPages = Math.ceil(total / limit)

    return {
      competitionSubmits,
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

    const rows = (await client.$queryRawUnsafe(
      `
                        SELECT DATE(DATE_ADD(started_at, INTERVAL 7 HOUR)) AS date, COUNT(*) AS count
            FROM competition_submits
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
    )) as Array<{ date: string | Date; count: number | bigint }>

    return rows.map((row) => ({
      date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date),
      count: typeof row.count === 'bigint' ? Number(row.count) : row.count,
    }))
  }

  async getStudentActivityDatesVn(studentId: number, txClient?: any): Promise<string[]> {
    const client = txClient || this.prisma

    const rows = (await client.$queryRawUnsafe(
      `
            SELECT DISTINCT DATE(DATE_ADD(started_at, INTERVAL 7 HOUR)) AS date
            FROM competition_submits
            WHERE student_id = ?
              AND started_at IS NOT NULL
              AND DATE(DATE_ADD(started_at, INTERVAL 7 HOUR)) <= DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR))
            ORDER BY date DESC
            `,
      studentId,
    )) as Array<{ date: string | Date }>

    return rows.map((row) => (row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date)))
  }

  private buildWhereClause(filters?: CompetitionSubmitFilterOptions): any {
    const where: any = {
      student: {
        user: filters?.isActive === undefined ? { isActive: true } : {},
      },
    }

    if (!filters) return where

    if (filters.competitionId !== undefined) {
      where.competitionId = filters.competitionId
    }

    if (filters.studentId !== undefined) {
      where.studentId = filters.studentId
    }

    if (filters.grade !== undefined) {
      where.student = { ...where.student, grade: filters.grade }
    }

    if (filters.highSchoolGraduationYear !== undefined) {
      where.student = {
        ...where.student,
        highSchoolGraduationYear: filters.highSchoolGraduationYear,
      }
    }

    if (filters.isActive !== undefined) {
      where.student = {
        ...where.student,
        user: {
          ...(where.student?.user || {}),
          isActive: filters.isActive,
        },
      }
    }

    if (filters.hasParentZaloId !== undefined) {
      where.student = {
        ...where.student,
        parentZaloId: filters.hasParentZaloId ? { not: null } : null,
      }
    }

    if (filters.classIds?.length) {
      where.student = {
        ...where.student,
        classStudents: {
          some: {
            classId: { in: filters.classIds },
          },
        },
      }
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.attemptNumber !== undefined) {
      where.attemptNumber = filters.attemptNumber
    }

    if (filters.startedFrom) {
      where.startedAt = { ...where.startedAt, gte: filters.startedFrom }
    }

    if (filters.startedTo) {
      where.startedAt = { ...where.startedAt, lte: filters.startedTo }
    }

    if (filters.submittedFrom) {
      where.submittedAt = { ...where.submittedAt, gte: filters.submittedFrom }
    }

    if (filters.submittedTo) {
      where.submittedAt = { ...where.submittedAt, lte: filters.submittedTo }
    }

    if (filters.isGraded !== undefined) {
      if (filters.isGraded) {
        where.status = CompetitionSubmitStatus.GRADED
      } else {
        where.status = {
          not: CompetitionSubmitStatus.GRADED,
        }
      }
    }

    return where
  }
}
