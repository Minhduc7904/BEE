// src/infrastructure/repositories/exam/prisma-question-exam.repository.ts
import { Injectable } from '@nestjs/common'
import { QuestionExam } from '../../../domain/entities/exam/question-exam.entity'
import { IQuestionExamRepository, CreateQuestionExamData } from '../../../domain/repositories/question-exam.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { QuestionExamMapper } from '../../mappers/exam/question-exam.mapper'

@Injectable()
export class PrismaQuestionExamRepository implements IQuestionExamRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateQuestionExamData, txClient?: any): Promise<QuestionExam> {
    const client = txClient || this.prisma

    const created = await client.questionExam.create({
      data: {
        questionId: data.questionId,
        examId: data.examId,
        sectionId: data.sectionId,
        order: data.order,
        points: data.points,
      },
    })

    return QuestionExamMapper.toDomainQuestionExam(created)!
  }

  async createMany(dataArray: CreateQuestionExamData[], txClient?: any): Promise<number> {
    const client = txClient || this.prisma

    const result = await client.questionExam.createMany({
      data: dataArray.map(data => ({
        questionId: data.questionId,
        examId: data.examId,
        sectionId: data.sectionId,
        order: data.order,
        points: data.points,
      })),
      skipDuplicates: true,
    })

    return result.count
  }

  async findByExamId(examId: number, txClient?: any): Promise<QuestionExam[]> {
    const client = txClient || this.prisma

    const questionExams = await client.questionExam.findMany({
      where: { examId },
      orderBy: { order: 'asc' },
    })

    return QuestionExamMapper.toDomainQuestionExams(questionExams)
  }

  async findBySectionId(sectionId: number, txClient?: any): Promise<QuestionExam[]> {
    const client = txClient || this.prisma

    const questionExams = await client.questionExam.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
    })

    return QuestionExamMapper.toDomainQuestionExams(questionExams)
  }

  async findByQuestionAndExam(questionId: number, examId: number, txClient?: any): Promise<QuestionExam | null> {
    const client = txClient || this.prisma

    const questionExam = await client.questionExam.findUnique({
      where: {
        questionId_examId: {
          questionId,
          examId,
        },
      },
    })

    return questionExam ? QuestionExamMapper.toDomainQuestionExam(questionExam) : null
  }

  async update(questionId: number, examId: number, data: Partial<CreateQuestionExamData>, txClient?: any): Promise<QuestionExam> {
    const client = txClient || this.prisma

    const updated = await client.questionExam.update({
      where: {
        questionId_examId: {
          questionId,
          examId,
        },
      },
      data: {
        ...(data.sectionId !== undefined && { sectionId: data.sectionId }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.points !== undefined && { points: data.points }),
      },
    })

    return QuestionExamMapper.toDomainQuestionExam(updated)!
  }

  async delete(questionId: number, examId: number, txClient?: any): Promise<void> {
    const client = txClient || this.prisma

    await client.questionExam.delete({
      where: {
        questionId_examId: {
          questionId,
          examId,
        },
      },
    })
  }
}
