// src/application/dtos/temp-question/temp-question.dto.ts
import { TempQuestion } from '../../../domain/entities/exam-import/temp-question.entity'
import { QuestionType, Difficulty } from '../../../shared/enums'

export class TempStatementResponseDto {
  tempStatementId: number
  content: string
  processedContent?: string
  isCorrect: boolean
  order?: number | null
  difficulty?: Difficulty | null
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export class TempQuestionResponseDto {
  tempQuestionId: number
  sessionId: number
  tempSectionId?: string | null
  content: string
  processedContent?: string
  type: QuestionType
  correctAnswer?: string | null
  solution?: string | null
  processedSolution?: string | null
  difficulty?: Difficulty | null
  solutionYoutubeUrl?: string | null
  grade?: number | null
  subjectId?: number | null
  subjectName?: string
  pointsOrigin?: number | null
  order: number
  metadata?: any
  questionId?: number | null
  createdAt: Date
  updatedAt: Date

  // Relations
  tempStatements?: TempStatementResponseDto[]

  // Computed
  hasCorrectAnswer: boolean
  hasSolution: boolean
  hasDifficulty: boolean
  hasStatements: boolean
  isMigrated: boolean

  static fromEntity(tempQuestion: TempQuestion): TempQuestionResponseDto {
    return {
      tempQuestionId: tempQuestion.tempQuestionId,
      sessionId: tempQuestion.sessionId,
      tempSectionId: tempQuestion.tempSectionId ?? null,
      content: tempQuestion.content,
      processedContent: undefined, // Will be set by use case
      type: tempQuestion.type,
      correctAnswer: tempQuestion.correctAnswer ?? null,
      solution: tempQuestion.solution ?? null,
      processedSolution: undefined, // Will be set by use case
      difficulty: tempQuestion.difficulty ?? null,
      solutionYoutubeUrl: tempQuestion.solutionYoutubeUrl ?? null,
      grade: tempQuestion.grade ?? null,
      subjectId: tempQuestion.subjectId ?? null,
      subjectName: tempQuestion.subject?.name,
      pointsOrigin: tempQuestion.pointsOrigin ?? null,
      order: tempQuestion.order,
      metadata: tempQuestion.metadata,
      questionId: tempQuestion.questionId ?? null,
      createdAt: tempQuestion.createdAt,
      updatedAt: tempQuestion.updatedAt,
      tempStatements: tempQuestion.tempStatements?.map((stmt) => ({
        tempStatementId: stmt.tempStatementId,
        content: stmt.content,
        processedContent: undefined, // Will be set by use case
        isCorrect: stmt.isCorrect,
        order: stmt.order ?? null,
        difficulty: stmt.difficulty ?? null,
        metadata: stmt.metadata,
        createdAt: stmt.createdAt,
        updatedAt: stmt.updatedAt,
      })),
      hasCorrectAnswer: tempQuestion.hasCorrectAnswer(),
      hasSolution: tempQuestion.hasSolution(),
      hasDifficulty: tempQuestion.hasDifficulty(),
      hasStatements: tempQuestion.hasStatements(),
      isMigrated: tempQuestion.isMigrated(),
    }
  }

  static fromEntities(tempQuestions: TempQuestion[]): TempQuestionResponseDto[] {
    return tempQuestions.map((tq) => TempQuestionResponseDto.fromEntity(tq))
  }
}
