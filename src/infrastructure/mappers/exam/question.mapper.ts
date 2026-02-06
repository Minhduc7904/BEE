// src/infrastructure/mappers/exam/question.mapper.ts
import { Question as PrismaQuestion } from '@prisma/client'
import { Question } from '../../../domain/entities/exam/question.entity'
import { StatementMapper } from './statement.mapper'
import { SubjectMapper } from '../subject/subject.mapper'
import { QuestionChapterMapper } from './question-chapter.mapper'
import { QuestionExamMapper } from './question-exam.mapper'

export class QuestionMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomainQuestion(prisma: any): Question | null {
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
      subject: prisma.subject ? SubjectMapper.toDomainSubject(prisma.subject) : undefined,
      admin: prisma.admin,
      statements: prisma.statements ? StatementMapper.toDomainStatements(prisma.statements) : undefined,
      questionChapters: prisma.questionChapters ? QuestionChapterMapper.toDomainQuestionChapters(prisma.questionChapters) : undefined,
      examQuestions: prisma.examQuestions ? QuestionExamMapper.toDomainQuestionExams(prisma.examQuestions) : undefined,
    })
  }

  /**
   * Convert array of Prisma models to Domain entities
   */
  static toDomainQuestions(prismaQuestions: any[]): Question[] {
    return prismaQuestions.map((prisma) => this.toDomainQuestion(prisma)!).filter(Boolean)
  }
}
