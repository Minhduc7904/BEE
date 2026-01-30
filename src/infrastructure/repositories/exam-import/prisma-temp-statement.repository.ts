import { Injectable } from '@nestjs/common'
import { TempStatement } from '../../../domain/entities/exam-import/temp-statement.entity'
import {
  CreateTempStatementData,
  ITempStatementRepository,
  UpdateTempStatementData,
} from '../../../domain/repositories/temp-statement.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { TempStatementMapper } from '../../mappers/exam-import/temp-statement.mapper'

@Injectable()
export class PrismaTempStatementRepository implements ITempStatementRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateTempStatementData): Promise<TempStatement> {
    const created = await this.prisma.tempStatement.create({
      data: {
        tempQuestionId: data.tempQuestionId,
        content: data.content,
        isCorrect: data.isCorrect,
        order: data.order,
        difficulty: data.difficulty,
        metadata: data.metadata,
      },
    })

    return TempStatementMapper.toDomainTempStatement(created)!
  }

  async findById(tempStatementId: string): Promise<TempStatement | null> {
    const tempStatement = await this.prisma.tempStatement.findUnique({
      where: { tempStatementId },
    })

    if (!tempStatement) return null

    return TempStatementMapper.toDomainTempStatement(tempStatement)!
  }

  async findByTempQuestionId(tempQuestionId: string): Promise<TempStatement[]> {
    const tempStatements = await this.prisma.tempStatement.findMany({
      where: { tempQuestionId },
      orderBy: { order: 'asc' },
    })

    return TempStatementMapper.toDomainTempStatements(tempStatements)
  }

  async findByStatementId(statementId: number): Promise<TempStatement | null> {
    const tempStatement = await this.prisma.tempStatement.findUnique({
      where: { statementId },
    })

    if (!tempStatement) return null

    return TempStatementMapper.toDomainTempStatement(tempStatement)!
  }

  async findAll(): Promise<TempStatement[]> {
    const tempStatements = await this.prisma.tempStatement.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return TempStatementMapper.toDomainTempStatements(tempStatements)
  }

  async update(tempStatementId: string, data: UpdateTempStatementData): Promise<TempStatement> {
    const updated = await this.prisma.tempStatement.update({
      where: { tempStatementId },
      data: {
        content: data.content,
        isCorrect: data.isCorrect,
        order: data.order,
        difficulty: data.difficulty,
        metadata: data.metadata,
        statementId: data.statementId,
      },
    })

    return TempStatementMapper.toDomainTempStatement(updated)!
  }

  async delete(tempStatementId: string): Promise<void> {
    await this.prisma.tempStatement.delete({
      where: { tempStatementId },
    })
  }

  async linkToFinalStatement(tempStatementId: string, statementId: number): Promise<TempStatement> {
    const updated = await this.prisma.tempStatement.update({
      where: { tempStatementId },
      data: { statementId },
    })

    return TempStatementMapper.toDomainTempStatement(updated)!
  }
}
