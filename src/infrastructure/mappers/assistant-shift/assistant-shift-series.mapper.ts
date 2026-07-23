import type { AssistantShiftSeries as PrismaAssistantShiftSeries } from '@prisma/client'

import { AssistantShiftSeries } from '../../../domain/entities/assistant-shift'

export class AssistantShiftSeriesMapper {
  static toDomain(record: PrismaAssistantShiftSeries | null | undefined): AssistantShiftSeries | null {
    if (!record) return null

    return new AssistantShiftSeries({
      assistantShiftSeriesId: record.assistantShiftSeriesId,
      name: record.name,
      isLocked: record.isLocked,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  static toDomainList(records: PrismaAssistantShiftSeries[] | null | undefined): AssistantShiftSeries[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomain(record))
      .filter((record): record is AssistantShiftSeries => record !== null)
  }
}
