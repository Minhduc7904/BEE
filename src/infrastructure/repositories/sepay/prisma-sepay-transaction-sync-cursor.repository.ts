import { Prisma } from '@prisma/client'

import { SepayTransactionSyncCursor } from '../../../domain/entities/sepay'
import type {
  CreateSepayTransactionSyncCursorData,
  SepayTransactionSyncCursorListOptions,
  UpdateSepayTransactionSyncCursorData,
} from '../../../domain/interface/sepay'
import type { ISepayTransactionSyncCursorRepository } from '../../../domain/repositories/sepay-transaction-sync-cursor.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { SepayTransactionSyncCursorMapper } from '../../mappers/sepay'

export class PrismaSepayTransactionSyncCursorRepository implements ISepayTransactionSyncCursorRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateSepayTransactionSyncCursorData): Promise<SepayTransactionSyncCursor> {
    const created = await this.prisma.sepayTransactionSyncCursor.create({
      data: this.toCreateData(data),
    })
    return SepayTransactionSyncCursorMapper.toDomain(created)!
  }

  async findByScope(scope: string): Promise<SepayTransactionSyncCursor | null> {
    const cursor = await this.prisma.sepayTransactionSyncCursor.findUnique({ where: { scope } })
    return SepayTransactionSyncCursorMapper.toDomain(cursor)
  }

  async findAll(
    options: SepayTransactionSyncCursorListOptions,
  ): Promise<{ data: SepayTransactionSyncCursor[]; total: number }> {
    const where: Prisma.SepayTransactionSyncCursorWhereInput = {
      ...(options.search && { scope: { contains: options.search } }),
    }
    const [cursors, total] = await Promise.all([
      this.prisma.sepayTransactionSyncCursor.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { [options.sortBy ?? 'scope']: options.sortOrder ?? 'asc' },
      }),
      this.prisma.sepayTransactionSyncCursor.count({ where }),
    ])
    return { data: cursors.map((cursor) => SepayTransactionSyncCursorMapper.toDomain(cursor)!), total }
  }

  async upsert(data: CreateSepayTransactionSyncCursorData): Promise<SepayTransactionSyncCursor> {
    const cursor = await this.prisma.sepayTransactionSyncCursor.upsert({
      where: { scope: data.scope },
      create: this.toCreateData(data),
      update: this.toUpdateData(data),
    })
    return SepayTransactionSyncCursorMapper.toDomain(cursor)!
  }

  async updateByScope(scope: string, data: UpdateSepayTransactionSyncCursorData): Promise<SepayTransactionSyncCursor> {
    const updated = await this.prisma.sepayTransactionSyncCursor.update({
      where: { scope },
      data: this.toUpdateData(data),
    })
    return SepayTransactionSyncCursorMapper.toDomain(updated)!
  }

  private toCreateData(data: CreateSepayTransactionSyncCursorData): Prisma.SepayTransactionSyncCursorCreateInput {
    return {
      scope: data.scope,
      ...(data.lastSinceId !== undefined && { lastSinceId: data.lastSinceId }),
      ...(data.lastSyncedAt !== undefined && { lastSyncedAt: data.lastSyncedAt }),
      ...(data.lastErrorAt !== undefined && { lastErrorAt: data.lastErrorAt }),
      ...(data.lastErrorMessage !== undefined && { lastErrorMessage: data.lastErrorMessage }),
    }
  }

  private toUpdateData(data: UpdateSepayTransactionSyncCursorData): Prisma.SepayTransactionSyncCursorUpdateInput {
    return {
      ...(data.lastSinceId !== undefined && { lastSinceId: data.lastSinceId }),
      ...(data.lastSyncedAt !== undefined && { lastSyncedAt: data.lastSyncedAt }),
      ...(data.lastErrorAt !== undefined && { lastErrorAt: data.lastErrorAt }),
      ...(data.lastErrorMessage !== undefined && { lastErrorMessage: data.lastErrorMessage }),
    }
  }
}
