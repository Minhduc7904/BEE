// src/infrastructure/mappers/exam-import/temp-question.mapper.ts

import { TempQuestion } from '../../../domain/entities/exam-import/temp-question.entity'
import { SubjectMapper } from '../subject/subject.mapper'
import { TempStatementMapper } from './temp-statement.mapper'
import { QuestionType, Difficulty } from 'src/shared/enums'

/**
 * Mapper class để convert từ Prisma TempQuestion model
 * sang Domain TempQuestion entity
 */
export class TempQuestionMapper {
  /**
   * Convert Prisma TempQuestion sang Domain TempQuestion
   */
  static toDomainTempQuestion(prismaQuestion: any): TempQuestion | undefined {
    if (!prismaQuestion) return undefined

    return new TempQuestion({
      tempQuestionId: prismaQuestion.tempQuestionId,
      sessionId: prismaQuestion.sessionId,
      tempSectionId: prismaQuestion.tempSectionId,
      content: prismaQuestion.content,
      type: prismaQuestion.type as QuestionType,
      correctAnswer: prismaQuestion.correctAnswer,
      solution: prismaQuestion.solution,
      difficulty: prismaQuestion.difficulty ? (prismaQuestion.difficulty as Difficulty) : undefined,
      order: prismaQuestion.order,
      subjectId: prismaQuestion.subjectId,
      metadata: prismaQuestion.metadata,
      questionId: prismaQuestion.questionId,
      createdAt: prismaQuestion.createdAt,
      updatedAt: prismaQuestion.updatedAt,

      // Relations
      subject: prismaQuestion.subject
        ? SubjectMapper.toDomainSubject(prismaQuestion.subject)
        : undefined,
      tempStatements: prismaQuestion.tempStatements
        ? TempStatementMapper.toDomainTempStatements(prismaQuestion.tempStatements)
        : undefined,
    })
  }

  /**
   * Convert array Prisma TempQuestions sang Domain TempQuestions
   */
  static toDomainTempQuestions(prismaQuestions: any[]): TempQuestion[] {
    return prismaQuestions
      .map((question) => this.toDomainTempQuestion(question))
      .filter(Boolean) as TempQuestion[]
  }
}
