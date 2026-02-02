// src/infrastructure/mappers/exam/statement.mapper.ts
import { Statement as PrismaStatement } from '@prisma/client'
import { Statement } from '../../../domain/entities/exam/statement.entity'

export class StatementMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomainStatement(prisma: PrismaStatement | null): Statement | null {
    if (!prisma) return null

    return new Statement({
      statementId: prisma.statementId,
      content: prisma.content,
      questionId: prisma.questionId,
      isCorrect: prisma.isCorrect,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
      order: prisma.order,
      difficulty: prisma.difficulty as any,
    })
  }

  /**
   * Convert array of Prisma models to Domain entities
   */
  static toDomainStatements(prismaStatements: PrismaStatement[]): Statement[] {
    return prismaStatements.map((prisma) => this.toDomainStatement(prisma)!).filter(Boolean)
  }
}
