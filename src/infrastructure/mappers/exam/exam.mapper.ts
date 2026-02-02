// src/infrastructure/mappers/exam/exam.mapper.ts
import { Exam as PrismaExam } from '@prisma/client'
import { Exam } from '../../../domain/entities/exam/exam.entity'

export class ExamMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomainExam(prisma: PrismaExam | null): Exam | null {
    if (!prisma) return null

    return new Exam({
      examId: prisma.examId,
      title: prisma.title,
      grade: prisma.grade ?? undefined,
      createdBy: prisma.createdBy,
      visibility: prisma.visibility as any,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
      description: prisma.description,
      subjectId: prisma.subjectId,
      solutionYoutubeUrl: prisma.solutionYoutubeUrl,
    })
  }

  /**
   * Convert array of Prisma models to Domain entities
   */
  static toDomainExams(prismaExams: PrismaExam[]): Exam[] {
    return prismaExams.map((prisma) => this.toDomainExam(prisma)!).filter(Boolean)
  }
}
