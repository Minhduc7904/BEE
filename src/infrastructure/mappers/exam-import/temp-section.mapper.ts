// src/infrastructure/mappers/exam-import/temp-section.mapper.ts

import { TempSection } from '../../../domain/entities/exam-import/temp-section.entity'
import { TempQuestionMapper } from './temp-question.mapper'

/**
 * Mapper class để convert từ Prisma TempSection model
 * sang Domain TempSection entity
 */
export class TempSectionMapper {
  /**
   * Convert Prisma TempSection sang Domain TempSection
   */
  static toDomainTempSection(prismaSection: any): TempSection | undefined {
    if (!prismaSection) return undefined

    return new TempSection({
      tempSectionId: prismaSection.tempSectionId,
      sessionId: prismaSection.sessionId,
      tempExamId: prismaSection.tempExamId ?? null,
      title: prismaSection.title,
      description: prismaSection.description,
      order: prismaSection.order,
      metadata: prismaSection.metadata,
      sectionId: prismaSection.sectionId,
      createdAt: prismaSection.createdAt,
      updatedAt: prismaSection.updatedAt,

      // Relations
      tempQuestions: prismaSection.tempQuestions
        ? TempQuestionMapper.toDomainTempQuestions(prismaSection.tempQuestions)
        : undefined,
    })
  }

  /**
   * Convert array Prisma TempSections sang Domain TempSections
   */
  static toDomainTempSections(prismaSections: any[]): TempSection[] {
    return prismaSections
      .map((section) => this.toDomainTempSection(section))
      .filter(Boolean) as TempSection[]
  }
}
