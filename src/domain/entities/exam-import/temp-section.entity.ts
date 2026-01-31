// src/domain/entities/exam-import/temp-section.entity.ts

import { ExamImportSession } from './exam-import-session.entity'
import { TempExam } from './temp-exam.entity'
import { TempQuestion } from './temp-question.entity'

export class TempSection {
  // Required properties
  tempSectionId: string
  sessionId: number
  tempExamId: string
  title: string
  order: number
  createdAt: Date
  updatedAt: Date

  // Optional properties
  description?: string | null
  metadata?: any | null
  sectionId?: number | null

  // Relations
  session?: ExamImportSession | null
  tempExam?: TempExam | null
  finalSection?: any | null // Section entity
  tempQuestions?: TempQuestion[]

  constructor(data: {
    tempSectionId: string
    sessionId: number
    tempExamId: string
    title: string
    order: number
    createdAt: Date
    updatedAt: Date
    description?: string | null
    metadata?: any | null
    sectionId?: number | null
    session?: ExamImportSession | null
    tempExam?: TempExam | null
    finalSection?: any | null
    tempQuestions?: TempQuestion[]
  }) {
    this.tempSectionId = data.tempSectionId
    this.sessionId = data.sessionId
    this.tempExamId = data.tempExamId
    this.title = data.title
    this.order = data.order
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.description = data.description
    this.metadata = data.metadata
    this.sectionId = data.sectionId
    this.session = data.session
    this.tempExam = data.tempExam
    this.finalSection = data.finalSection
    this.tempQuestions = data.tempQuestions
  }

  /**
   * Kiểm tra có mô tả không
   */
  hasDescription(): boolean {
    return Boolean(this.description && this.description.trim().length > 0)
  }

  /**
   * Kiểm tra đã migrate sang bảng chính chưa
   */
  isMigrated(): boolean {
    return this.sectionId !== null && this.sectionId !== undefined
  }

  /**
   * Kiểm tra có questions không
   */
  hasQuestions(): boolean {
    return Boolean(this.tempQuestions && this.tempQuestions.length > 0)
  }

  /**
   * Lấy số lượng questions
   */
  getQuestionsCount(): number {
    return this.tempQuestions?.length || 0
  }

  /**
   * Serialize để gửi qua API
   */
  toJSON() {
    return {
      tempSectionId: this.tempSectionId,
      sessionId: this.sessionId,
      tempExamId: this.tempExamId,
      title: this.title,
      description: this.description,
      order: this.order,
      metadata: this.metadata,
      sectionId: this.sectionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed fields
      hasDescription: this.hasDescription(),
      isMigrated: this.isMigrated(),
      hasQuestions: this.hasQuestions(),
      questionsCount: this.getQuestionsCount(),
    }
  }

  /**
   * Tạo entity từ Prisma model data
   */
  static fromPrisma(data: any): TempSection {
    return new TempSection({
      tempSectionId: data.tempSectionId,
      sessionId: data.sessionId,
      tempExamId: data.tempExamId,
      title: data.title,
      description: data.description,
      order: data.order,
      metadata: data.metadata,
      sectionId: data.sectionId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      session: data.session,
      tempExam: data.tempExam,
      finalSection: data.finalSection,
      tempQuestions: data.tempQuestions
        ? data.tempQuestions.map((q: any) => TempQuestion.fromPrisma(q))
        : undefined,
    })
  }

  /**
   * So sánh hai entities
   */
  equals(other: TempSection): boolean {
    return this.tempSectionId === other.tempSectionId
  }
}
