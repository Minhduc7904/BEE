// src/application/dtos/temp-section/temp-section.dto.ts
import { TempSection } from '../../../domain/entities/exam-import/temp-section.entity'

export class TempSectionResponseDto {
  tempSectionId: number
  sessionId: number
  tempExamId?: number | null
  title: string
  description?: string | null
  order: number
  metadata?: any
  sectionId?: number | null
  createdAt: Date
  updatedAt: Date

  // Computed
  hasDescription: boolean
  isMigrated: boolean

  static fromEntity(tempSection: TempSection): TempSectionResponseDto {
    return {
      tempSectionId: tempSection.tempSectionId,
      sessionId: tempSection.sessionId,
      tempExamId: tempSection.tempExamId ?? null,
      title: tempSection.title,
      description: tempSection.description ?? undefined,
      order: tempSection.order,
      metadata: tempSection.metadata,
      sectionId: tempSection.sectionId ?? undefined,
      createdAt: tempSection.createdAt,
      updatedAt: tempSection.updatedAt,
      hasDescription: tempSection.hasDescription(),
      isMigrated: tempSection.isMigrated(),
    }
  }
}
