// src/infrastructure/mappers/exam/question.mapper.ts
import { Question as PrismaQuestion } from '@prisma/client'
import { Question } from '../../../domain/entities/exam/question.entity'

export class QuestionMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomainQuestion(prisma: PrismaQuestion | null): Question | null {
    if (!prisma) return null

    return new Question({
      questionId: prisma.questionId,
      content: prisma.content,
      type: prisma.type as any,
      difficulty: prisma.difficulty as any,
      grade: prisma.grade,
      visibility: prisma.visibility as any,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
      correctAnswer: prisma.correctAnswer,
      solution: prisma.solution,
      solutionYoutubeUrl: prisma.solutionYoutubeUrl,
      subjectId: prisma.subjectId,
      pointsOrigin: prisma.pointsOrigin,
      createdBy: prisma.createdBy,
    })
  }

  /**
   * Convert array of Prisma models to Domain entities
   */
  static toDomainQuestions(prismaQuestions: PrismaQuestion[]): Question[] {
    return prismaQuestions.map((prisma) => this.toDomainQuestion(prisma)!).filter(Boolean)
  }
}
