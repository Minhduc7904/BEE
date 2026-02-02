// src/infrastructure/repositories/exam/prisma-exam.repository.ts
import { Injectable } from '@nestjs/common'
import { Exam } from '../../../domain/entities/exam/exam.entity'
import { IExamRepository, CreateExamData } from '../../../domain/repositories/exam.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { ExamMapper } from '../../mappers/exam/exam.mapper'

@Injectable()
export class PrismaExamRepository implements IExamRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateExamData, txClient?: any): Promise<Exam> {
    const client = txClient || this.prisma

    const created = await client.exam.create({
      data: {
        title: data.title,
        description: data.description,
        grade: data.grade,
        visibility: data.visibility,
        solutionYoutubeUrl: data.solutionYoutubeUrl,
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
}
