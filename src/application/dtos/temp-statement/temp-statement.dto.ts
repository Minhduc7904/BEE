// src/application/dtos/temp-statement/temp-statement.dto.ts
import { TempStatement } from '../../../domain/entities/exam-import/temp-statement.entity'
import { Difficulty } from '../../../shared/enums'

export class TempStatementResponseDto {
  tempStatementId: number
  tempQuestionId: number
  content: string
  isCorrect: boolean
  order?: number | null
  difficulty?: Difficulty | null
  metadata?: any
  statementId?: number | null
  createdAt: Date
  updatedAt: Date

  // Computed
  isMigrated: boolean

  static fromEntity(tempStatement: TempStatement): TempStatementResponseDto {
    return {
      tempStatementId: tempStatement.tempStatementId,
      tempQuestionId: tempStatement.tempQuestionId,
      content: tempStatement.content,
      isCorrect: tempStatement.isCorrect,
      order: tempStatement.order ?? undefined,
      difficulty: tempStatement.difficulty ?? undefined,
      metadata: tempStatement.metadata,
      statementId: tempStatement.statementId ?? undefined,
      createdAt: tempStatement.createdAt,
      updatedAt: tempStatement.updatedAt,
      isMigrated: tempStatement.isMigrated(),
    }
  }

  static fromEntities(tempStatements: TempStatement[]): TempStatementResponseDto[] {
    return tempStatements.map((ts) => TempStatementResponseDto.fromEntity(ts))
  }
}
