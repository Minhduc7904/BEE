// src/infrastructure/mappers/exam-import/exam-import-session.mapper.ts

import { ExamImportSession } from '../../../domain/entities/exam-import/exam-import-session.entity'
import { ImportStatus } from '../../../shared/enums/import-status.enum'
import { TempExamMapper } from './temp-exam.mapper'
import { TempSectionMapper } from './temp-section.mapper'
import { TempQuestionMapper } from './temp-question.mapper'

/**
 * Mapper class để convert từ Prisma ExamImportSession model
 * sang Domain ExamImportSession entity
 */
export class ExamImportSessionMapper {
  /**
   * Convert Prisma ExamImportSession sang Domain ExamImportSession
   */
  static toDomainExamImportSession(prismaSession: any): ExamImportSession | undefined {
    if (!prismaSession) return undefined

    return new ExamImportSession({
      sessionId: prismaSession.sessionId,
      status: prismaSession.status as ImportStatus,
      rawContent: prismaSession.rawContent,
      metadata: prismaSession.metadata,
      createdBy: prismaSession.createdBy,
      approvedBy: prismaSession.approvedBy,
      approvedAt: prismaSession.approvedAt,
      completedAt: prismaSession.completedAt,
      createdAt: prismaSession.createdAt,
      updatedAt: prismaSession.updatedAt,

      // Relations
      tempExam: prismaSession.tempExam
        ? TempExamMapper.toDomainTempExam(prismaSession.tempExam)
        : undefined,
      tempSections: prismaSession.tempSections
        ? TempSectionMapper.toDomainTempSections(prismaSession.tempSections)
        : undefined,
      tempQuestions: prismaSession.tempQuestions
        ? TempQuestionMapper.toDomainTempQuestions(prismaSession.tempQuestions)
        : undefined,
    })
  }

  /**
   * Convert array Prisma ExamImportSessions sang Domain ExamImportSessions
   */
  static toDomainExamImportSessions(prismaSessions: any[]): ExamImportSession[] {
    return prismaSessions
      .map((session) => this.toDomainExamImportSession(session))
      .filter(Boolean) as ExamImportSession[]
  }
}
