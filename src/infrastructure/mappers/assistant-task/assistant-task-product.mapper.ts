import type { AssistantTaskProduct as PrismaAssistantTaskProduct } from '@prisma/client'

import { AssistantTaskProduct } from '../../../domain/entities/assistant-task'

export class AssistantTaskProductMapper {
  static toDomain(record: PrismaAssistantTaskProduct | null | undefined): AssistantTaskProduct | null {
    if (!record) return null

    return new AssistantTaskProduct({
      assistantTaskProductId: record.assistantTaskProductId,
      assistantTaskId: record.assistantTaskId,
      name: record.name,
      quantity: record.quantity,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  static toDomainList(records: PrismaAssistantTaskProduct[] | null | undefined): AssistantTaskProduct[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomain(record))
      .filter((record): record is AssistantTaskProduct => record !== null)
  }
}
