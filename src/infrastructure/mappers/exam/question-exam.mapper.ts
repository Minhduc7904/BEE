// src/infrastructure/mappers/exam/question-exam.mapper.ts
import { QuestionExam as PrismaQuestionExam } from '@prisma/client'
import { QuestionExam } from '../../../domain/entities/exam/question-exam.entity'
import { QuestionMapper } from './question.mapper'

export class QuestionExamMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomainQuestionExam(prisma: any | null): QuestionExam | null {
    if (!prisma) return null

    return new QuestionExam({
      questionId: prisma.questionId,
      examId: prisma.examId,
      sectionId: prisma.sectionId ?? null,
      order: prisma.order,
      createdAt: prisma.createdAt || new Date(),
      points: prisma.points,
      // Map nested question relation if present
      question: prisma.question ? QuestionMapper.toDomainQuestion(prisma.question) ?? undefined : undefined,
    })
  }

  /**
   * Convert array of Prisma models to Domain entities
   */
  static toDomainQuestionExams(prismaQuestionExams: any[]): QuestionExam[] {
    return prismaQuestionExams.map((prisma) => this.toDomainQuestionExam(prisma)!).filter(Boolean)
  }
}
