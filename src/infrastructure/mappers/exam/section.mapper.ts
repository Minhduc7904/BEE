// src/infrastructure/mappers/exam/section.mapper.ts
import { Section as PrismaSection } from '@prisma/client'
import { Section } from '../../../domain/entities/exam/section.entity'
import { QuestionExamMapper } from './question-exam.mapper'

export class SectionMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomainSection(prisma: any | null): Section | null {
    if (!prisma) return null

    return new Section({
      sectionId: prisma.sectionId,
      examId: prisma.examId,
      title: prisma.title,
      order: prisma.order,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
      description: prisma.description,
      // Map nested questions relation if present
      questions: prisma.questions
        ? QuestionExamMapper.toDomainQuestionExams(prisma.questions)
        : undefined,
    })
  }

  /**
   * Convert array of Prisma models to Domain entities
   */
  static toDomainSections(prismaSections: any[]): Section[] {
    return prismaSections.map((prisma) => this.toDomainSection(prisma)!).filter(Boolean)
  }
}
