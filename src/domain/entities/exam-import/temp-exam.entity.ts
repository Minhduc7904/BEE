// src/domain/entities/exam-import/temp-exam.entity.ts

import { ExamVisibility } from '../../../shared/enums'
import { Subject } from '../subject/subject.entity'
import { Exam } from '../exam/exam.entity'
import { TempSection } from './temp-section.entity'
import { ExamImportSession } from './exam-import-session.entity'

export class TempExam {
  // Required properties
  tempExamId: number
  sessionId: number
  title: string
  createdAt: Date
  updatedAt: Date

  // Optional properties
  description?: string | null
  grade?: number | null
  subjectId?: number | null
  visibility: ExamVisibility
  metadata?: any | null
  examId?: number | null

  // Relations
  session?: ExamImportSession | null
  subject?: Subject | null
  finalExam?: Exam | null
  tempSections?: TempSection[]

  constructor(data: {
    tempExamId: number
    sessionId: number
    title: string
    createdAt: Date
    updatedAt: Date
    description?: string | null
    grade?: number | null
    subjectId?: number | null
    visibility?: ExamVisibility
    metadata?: any | null
    examId?: number | null
    session?: ExamImportSession | null
    subject?: Subject | null
    finalExam?: Exam | null
    tempSections?: TempSection[]
  }) {
    this.tempExamId = data.tempExamId
    this.sessionId = data.sessionId
    this.title = data.title
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.description = data.description
    this.grade = data.grade
    this.subjectId = data.subjectId
    this.visibility = data.visibility || ExamVisibility.DRAFT
    this.metadata = data.metadata
    this.examId = data.examId
    this.session = data.session
    this.subject = data.subject
    this.finalExam = data.finalExam
    this.tempSections = data.tempSections
  }

  /**
   * Kiểm tra đã có mô tả chưa
   */
  hasDescription(): boolean {
    return Boolean(this.description && this.description.trim().length > 0)
  }

  /**
   * Kiểm tra đã có grade chưa
   */
  hasGrade(): boolean {
    return this.grade !== null && this.grade !== undefined
  }

  /**
   * Kiểm tra đã có subject chưa
   */
  hasSubject(): boolean {
    return this.subjectId !== null && this.subjectId !== undefined
  }

  /**
   * Kiểm tra đã migrate sang bảng chính chưa
   */
  isMigrated(): boolean {
    return this.examId !== null && this.examId !== undefined
  }

  /**
   * Kiểm tra có sections chưa
   */
  hasSections(): boolean {
    return Boolean(this.tempSections && this.tempSections.length > 0)
  }

  /**
   * Lấy số lượng sections
   */
  getSectionsCount(): number {
    return this.tempSections?.length || 0
  }

  /**
   * Lấy visibility display
   */
  getVisibilityDisplay(): string {
    const visibilityMap = {
      [ExamVisibility.DRAFT]: 'Bản nháp',
      [ExamVisibility.PRIVATE]: 'Riêng tư',
      [ExamVisibility.PUBLISHED]: 'Đã xuất bản',
      [ExamVisibility.ARCHIVED]: 'Đã lưu trữ',
    }
    return visibilityMap[this.visibility] || 'Không xác định'
  }

  /**
   * Lấy tên subject
   */
  getSubjectName(): string {
    return this.subject?.name || 'Chưa xác định môn học'
  }

  /**
   * Serialize để gửi qua API
   */
  toJSON() {
    return {
      tempExamId: this.tempExamId,
      sessionId: this.sessionId,
      title: this.title,
      description: this.description,
      grade: this.grade,
      subjectId: this.subjectId,
      visibility: this.visibility,
      metadata: this.metadata,
      examId: this.examId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed fields
      hasDescription: this.hasDescription(),
      hasGrade: this.hasGrade(),
      hasSubject: this.hasSubject(),
      isMigrated: this.isMigrated(),
      hasSections: this.hasSections(),
      sectionsCount: this.getSectionsCount(),
      visibilityDisplay: this.getVisibilityDisplay(),
      subjectName: this.getSubjectName(),
      // Relations
      subject: this.subject ? this.subject.toJSON() : undefined,
      finalExam: this.finalExam ? this.finalExam.toJSON() : undefined,
    }
  }

  /**
   * Tạo entity từ Prisma model data
   */
  static fromPrisma(data: any): TempExam {
    return new TempExam({
      tempExamId: data.tempExamId,
      sessionId: data.sessionId,
      title: data.title,
      description: data.description,
      grade: data.grade,
      subjectId: data.subjectId,
      visibility: data.visibility as ExamVisibility,
      metadata: data.metadata,
      examId: data.examId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      session: data.session,
      subject: data.subject ? Subject.fromPrisma(data.subject) : undefined,
      finalExam: data.finalExam ? Exam.fromPrisma(data.finalExam) : undefined,
      tempSections: data.tempSections
        ? data.tempSections.map((s: any) => TempSection.fromPrisma(s))
        : undefined,
    })
  }

  /**
   * So sánh hai entities
   */
  equals(other: TempExam): boolean {
    return this.tempExamId === other.tempExamId
  }
}
