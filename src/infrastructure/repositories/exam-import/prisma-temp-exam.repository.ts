import { Injectable } from '@nestjs/common'
import { TempExam } from '../../../domain/entities/exam-import/temp-exam.entity'
import {
  CreateTempExamData,
  ITempExamRepository,
  UpdateTempExamData,
} from '../../../domain/repositories/temp-exam.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { TempExamMapper } from '../../mappers/exam-import/temp-exam.mapper'

@Injectable()
export class PrismaTempExamRepository implements ITempExamRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateTempExamData): Promise<TempExam> {
    const created = await this.prisma.tempExam.create({
      data: {
        sessionId: data.sessionId,
        title: data.title,
        description: data.description,
        grade: data.grade,
        subjectId: data.subjectId,
        visibility: data.visibility,
        metadata: data.metadata,
        rawContent: data.rawContent,
      },
    })

    return TempExamMapper.toDomainTempExam(created)!
  }

  async findById(tempExamId: number): Promise<TempExam | null> {
    const tempExam = await this.prisma.tempExam.findUnique({
      where: { tempExamId },
    })

    if (!tempExam) return null

    return TempExamMapper.toDomainTempExam(tempExam)!
  }

  async findByIdWithRelations(tempExamId: number): Promise<TempExam | null> {
    const tempExam = await this.prisma.tempExam.findUnique({
      where: { tempExamId },
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
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!tempExam) return null

    return TempExamMapper.toDomainTempExam(tempExam)!
  }

  async findBySessionId(sessionId: number): Promise<TempExam | null> {
    const tempExam = await this.prisma.tempExam.findUnique({
      where: { sessionId },
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
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!tempExam) return null

    return TempExamMapper.toDomainTempExam(tempExam)!
  }

  async findByExamId(examId: number): Promise<TempExam | null> {
    const tempExam = await this.prisma.tempExam.findUnique({
      where: { examId },
    })

    if (!tempExam) return null

    return TempExamMapper.toDomainTempExam(tempExam)!
  }

  async findAll(): Promise<TempExam[]> {
    const tempExams = await this.prisma.tempExam.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return TempExamMapper.toDomainTempExams(tempExams)
  }

  async update(tempExamId: number, data: UpdateTempExamData): Promise<TempExam> {
    const updated = await this.prisma.tempExam.update({
      where: { tempExamId },
      data: {
        title: data.title,
        description: data.description,
        grade: data.grade,
        subjectId: data.subjectId,
        visibility: data.visibility,
        metadata: data.metadata,
        rawContent: data.rawContent,
        examId: data.examId,
      },
    })

    return TempExamMapper.toDomainTempExam(updated)!
  }

  async delete(tempExamId: number): Promise<void> {
    await this.prisma.tempExam.delete({
      where: { tempExamId },
    })
  }

  async linkToFinalExam(tempExamId: number, examId: number): Promise<TempExam> {
    const updated = await this.prisma.tempExam.update({
      where: { tempExamId },
      data: { examId },
    })

    return TempExamMapper.toDomainTempExam(updated)!
  }
}
