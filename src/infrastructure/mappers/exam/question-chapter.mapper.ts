// src/infrastructure/mappers/exam/question-chapter.mapper.ts
import { QuestionChapter as PrismaQuestionChapter } from '@prisma/client'
import { QuestionChapter } from '../../../domain/entities/exam/question-chapter.entity'

export class QuestionChapterMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomainQuestionChapter(prisma: PrismaQuestionChapter | null): QuestionChapter | null {
    if (!prisma) return null

    return new QuestionChapter({
      questionId: prisma.questionId,
      chapterId: prisma.chapterId,
    })
  }

  /**
   * Convert array of Prisma models to Domain entities
   */
  static toDomainQuestionChapters(prismaQuestionChapters: PrismaQuestionChapter[]): QuestionChapter[] {
    return prismaQuestionChapters.map((prisma) => this.toDomainQuestionChapter(prisma)!).filter(Boolean)
  }
}
