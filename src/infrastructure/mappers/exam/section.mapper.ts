// src/infrastructure/mappers/exam/section.mapper.ts
import { Section as PrismaSection } from '@prisma/client'
import { Section } from '../../../domain/entities/exam/section.entity'

export class SectionMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomainSection(prisma: PrismaSection | null): Section | null {
    if (!prisma) return null

    return new Section({
      sectionId: prisma.sectionId,
      examId: prisma.examId,
      title: prisma.title,
      order: prisma.order,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
      description: prisma.description,
    })
  }

  /**
   * Convert array of Prisma models to Domain entities
   */
  static toDomainSections(prismaSections: PrismaSection[]): Section[] {
    return prismaSections.map((prisma) => this.toDomainSection(prisma)!).filter(Boolean)
  }
}
