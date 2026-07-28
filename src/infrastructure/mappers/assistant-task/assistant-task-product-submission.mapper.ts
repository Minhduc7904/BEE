import type { AssistantTaskProductSubmission as PrismaAssistantTaskProductSubmission } from '@prisma/client'
import { AssistantTaskProductSubmission } from '../../../domain/entities/assistant-task/assistant-task-product-submission.entity'

export class AssistantTaskProductSubmissionMapper {
  static toDomain(
    record: PrismaAssistantTaskProductSubmission | null | undefined,
  ): AssistantTaskProductSubmission | null {
    if (!record) return null
    return new AssistantTaskProductSubmission(record)
  }

  static toDomainList(
    records: PrismaAssistantTaskProductSubmission[] | null | undefined,
  ): AssistantTaskProductSubmission[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomain(record))
      .filter((record): record is AssistantTaskProductSubmission => record !== null)
  }
}
