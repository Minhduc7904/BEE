import { Prisma } from '@prisma/client'

import { AssistantShiftSeries } from '../../../domain/entities/assistant-shift'
import type { IAssistantShiftSeriesRepository } from '../../../domain/repositories/assistant-shift-series.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { AssistantShiftSeriesMapper } from '../../mappers/assistant-shift'

export class PrismaAssistantShiftSeriesRepository implements IAssistantShiftSeriesRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: { name: string; isLocked?: boolean }): Promise<AssistantShiftSeries> {
    const created = await this.prisma.assistantShiftSeries.create({
      data: {
        name: data.name,
        isLocked: data.isLocked ?? false,
      },
    })
    return AssistantShiftSeriesMapper.toDomain(created)!
  }

  async findById(assistantShiftSeriesId: number): Promise<AssistantShiftSeries | null> {
    const record = await this.prisma.assistantShiftSeries.findUnique({
      where: { assistantShiftSeriesId },
    })

    return AssistantShiftSeriesMapper.toDomain(record)
  }

  async findAll(options?: { skip?: number; take?: number; isLocked?: boolean }): Promise<AssistantShiftSeries[]> {
    const records = await this.prisma.assistantShiftSeries.findMany({
      where: options?.isLocked === undefined ? undefined : { isLocked: options.isLocked },
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ createdAt: 'desc' }, { assistantShiftSeriesId: 'desc' }],
    })

    return AssistantShiftSeriesMapper.toDomainList(records)
  }

  async update(assistantShiftSeriesId: number, data: { name?: string; isLocked?: boolean }): Promise<AssistantShiftSeries> {
    const record = await this.prisma.assistantShiftSeries.update({
      where: { assistantShiftSeriesId },
      data,
    })

    return AssistantShiftSeriesMapper.toDomain(record)!
  }

  async delete(assistantShiftSeriesId: number): Promise<boolean> {
    await this.prisma.assistantShiftSeries.delete({
      where: { assistantShiftSeriesId },
    })

    return true
  }
}
