// src/infrastructure/mappers/exam-import/temp-exam.mapper.ts

import { TempExam } from '../../../domain/entities/exam-import/temp-exam.entity'
import { ExamVisibility } from '../../../shared/enums'
import { SubjectMapper } from '../subject/subject.mapper'
import { TempSectionMapper } from './temp-section.mapper'

/**
 * Mapper class để convert từ Prisma TempExam model
 * sang Domain TempExam entity
 */
export class TempExamMapper {
  /**
   * Convert Prisma TempExam sang Domain TempExam
   */
  static toDomainTempExam(prismaExam: any): TempExam | undefined {
    if (!prismaExam) return undefined

    return new TempExam({
      tempExamId: prismaExam.tempExamId,
      sessionId: prismaExam.sessionId,
      title: prismaExam.title,
      description: prismaExam.description,
      grade: prismaExam.grade,
      subjectId: prismaExam.subjectId,
      visibility: prismaExam.visibility as ExamVisibility,
      metadata: prismaExam.metadata,
      examId: prismaExam.examId,
      rawContent: prismaExam.rawContent,
      createdAt: prismaExam.createdAt,
      updatedAt: prismaExam.updatedAt,

      // Relations
      subject: prismaExam.subject
        ? SubjectMapper.toDomainSubject(prismaExam.subject)
        : undefined,
      tempSections: prismaExam.tempSections
        ? TempSectionMapper.toDomainTempSections(prismaExam.tempSections)
        : undefined,
    })
  }

  /**
   * Convert array Prisma TempExams sang Domain TempExams
   */
  static toDomainTempExams(prismaExams: any[]): TempExam[] {
    return prismaExams
      .map((exam) => this.toDomainTempExam(exam))
      .filter(Boolean) as TempExam[]
  }
}
