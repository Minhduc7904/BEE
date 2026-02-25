// src/infrastructure/repositories/exam/prisma-exam.repository.ts
import { Injectable } from '@nestjs/common'
import { Exam } from '../../../domain/entities/exam/exam.entity'
import {
  IExamRepository,
  CreateExamData,
  ExamFilterOptions,
  ExamPaginationOptions,
  ExamListResult,
} from '../../../domain/repositories/exam.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { ExamMapper } from '../../mappers/exam/exam.mapper'

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

    // Build where clause
    const where: any = {}

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ]
    }

    if (filters?.subjectId !== undefined) {
      where.subjectId = filters.subjectId
    }

    if (filters?.grade !== undefined) {
      where.grade = filters.grade
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

  async countQuestionsByExamId(examId: number, txClient?: any): Promise<number> {
    const client = txClient || this.prisma

    const count = await client.questionExam.count({
      where: {
        examId: examId,
      },
    })

    return count
  }
}
