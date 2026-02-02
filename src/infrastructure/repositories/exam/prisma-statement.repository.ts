// src/infrastructure/repositories/exam/prisma-statement.repository.ts
import { Injectable } from '@nestjs/common'
import { Statement } from '../../../domain/entities/exam/statement.entity'
import { IStatementRepository, CreateStatementData } from '../../../domain/repositories/statement.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { StatementMapper } from '../../mappers/exam/statement.mapper'

@Injectable()
export class PrismaStatementRepository implements IStatementRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateStatementData, txClient?: any): Promise<Statement> {
    const client = txClient || this.prisma

    const created = await client.statement.create({
      data: {
        content: data.content,
        questionId: data.questionId,
        isCorrect: data.isCorrect,
        order: data.order,
        difficulty: data.difficulty,
      },
    })

    return StatementMapper.toDomainStatement(created)!
  }

  async createMany(dataArray: CreateStatementData[], txClient?: any): Promise<number> {
    const client = txClient || this.prisma

    const result = await client.statement.createMany({
      data: dataArray.map(data => ({
        content: data.content,
        questionId: data.questionId,
        isCorrect: data.isCorrect,
        order: data.order,
        difficulty: data.difficulty,
      })),
    })

    return result.count
  }

  async findById(id: number, txClient?: any): Promise<Statement | null> {
    const client = txClient || this.prisma

    const statement = await client.statement.findUnique({
      where: { statementId: id },
    })

    if (!statement) return null

    return StatementMapper.toDomainStatement(statement)
  }

  async findByQuestionId(questionId: number, txClient?: any): Promise<Statement[]> {
    const client = txClient || this.prisma

    const statements = await client.statement.findMany({
      where: { questionId },
      orderBy: { order: 'asc' },
    })

    return StatementMapper.toDomainStatements(statements)
  }

  async findByQuestionIds(questionIds: number[], txClient?: any): Promise<Statement[]> {
    const client = txClient || this.prisma

    const statements = await client.statement.findMany({
      where: {
        questionId: { in: questionIds },
      },
      select: {
        statementId: true,
        questionId: true,
        order: true,
        content: true,
        isCorrect: true,
        difficulty: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ questionId: 'asc' }, { order: 'asc' }],
    })

    return StatementMapper.toDomainStatements(statements)
  }

  async update(id: number, data: Partial<CreateStatementData>, txClient?: any): Promise<Statement> {
    const client = txClient || this.prisma

    const updated = await client.statement.update({
      where: { statementId: id },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.isCorrect !== undefined && { isCorrect: data.isCorrect }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
      },
    })

    return StatementMapper.toDomainStatement(updated)!
  }

  async delete(id: number, txClient?: any): Promise<void> {
    const client = txClient || this.prisma

    await client.statement.delete({
      where: { statementId: id },
    })
  }
}
