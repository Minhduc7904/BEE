// src/infrastructure/mappers/exam-import/temp-statement.mapper.ts

import { TempStatement } from '../../../domain/entities/exam-import/temp-statement.entity'
import { Difficulty } from 'src/shared/enums'

/**
 * Mapper class để convert từ Prisma TempStatement model
 * sang Domain TempStatement entity
 */
export class TempStatementMapper {
  /**
   * Convert Prisma TempStatement sang Domain TempStatement
   */
  static toDomainTempStatement(prismaStatement: any): TempStatement | undefined {
    if (!prismaStatement) return undefined

    return new TempStatement({
      tempStatementId: prismaStatement.tempStatementId,
      tempQuestionId: prismaStatement.tempQuestionId,
      content: prismaStatement.content,
      isCorrect: prismaStatement.isCorrect,
      difficulty: prismaStatement.difficulty
        ? (prismaStatement.difficulty as Difficulty)
        : undefined,
      order: prismaStatement.order,
      metadata: prismaStatement.metadata,
      statementId: prismaStatement.statementId,
      createdAt: prismaStatement.createdAt,
      updatedAt: prismaStatement.updatedAt,
    })
  }

  /**
   * Convert array Prisma TempStatements sang Domain TempStatements
   */
  static toDomainTempStatements(prismaStatements: any[]): TempStatement[] {
    return prismaStatements
      .map((statement) => this.toDomainTempStatement(statement))
      .filter(Boolean) as TempStatement[]
  }
}
