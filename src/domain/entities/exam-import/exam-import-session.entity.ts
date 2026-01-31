// src/domain/entities/exam-import/exam-import-session.entity.ts

import { ImportStatus } from '../../../shared/enums/import-status.enum'
import { TempExam } from './temp-exam.entity'
import { TempSection } from './temp-section.entity'
import { TempQuestion } from './temp-question.entity'

export class ExamImportSession {
  // Required properties
  sessionId: number
  status: ImportStatus
  createdBy: number
  createdAt: Date
  updatedAt: Date

  // Optional properties
  rawContent?: string | null
  metadata?: any | null
  approvedBy?: number | null
  approvedAt?: Date | null
  completedAt?: Date | null

  // Relations
  tempExam?: TempExam | null
  tempSections?: TempSection[]
  tempQuestions?: TempQuestion[]

  constructor(data: {
    sessionId: number
    status: ImportStatus
    createdBy: number
    createdAt: Date
    updatedAt: Date
    rawContent?: string | null
    metadata?: any | null
    approvedBy?: number | null
    approvedAt?: Date | null
    completedAt?: Date | null
    tempExam?: TempExam | null
    tempSections?: TempSection[]
    tempQuestions?: TempQuestion[]
  }) {
    this.sessionId = data.sessionId
    this.status = data.status
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.rawContent = data.rawContent
    this.metadata = data.metadata
    this.approvedBy = data.approvedBy
    this.approvedAt = data.approvedAt
    this.completedAt = data.completedAt
    this.tempExam = data.tempExam
    this.tempSections = data.tempSections
    this.tempQuestions = data.tempQuestions
  }

  /**
   * Kiểm tra session đang pending
   */
  isPending(): boolean {
    return this.status === ImportStatus.PENDING
  }

  /**
   * Kiểm tra session đang xử lý
   */
  isProcessing(): boolean {
    return this.status === ImportStatus.PROCESSING
  }

  /**
   * Kiểm tra session đã parse xong
   */
  isParsed(): boolean {
    return this.status === ImportStatus.PARSED
  }

  /**
   * Kiểm tra session đang review
   */
  isReviewing(): boolean {
    return this.status === ImportStatus.REVIEWING
  }

  /**
   * Kiểm tra session đã được duyệt
   */
  isApproved(): boolean {
    return this.status === ImportStatus.APPROVED
  }

  /**
   * Kiểm tra session đã hoàn thành
   */
  isCompleted(): boolean {
    return this.status === ImportStatus.COMPLETED
  }

  /**
   * Kiểm tra session bị từ chối
   */
  isRejected(): boolean {
    return this.status === ImportStatus.REJECTED
  }

  /**
   * Kiểm tra session thất bại
   */
  isFailed(): boolean {
    return this.status === ImportStatus.FAILED
  }

  /**
   * Kiểm tra session có raw content không
   */
  hasRawContent(): boolean {
    return Boolean(this.rawContent && this.rawContent.trim().length > 0)
  }

  /**
   * Kiểm tra session đã được duyệt chưa
   */
  hasApprover(): boolean {
    return this.approvedBy !== null && this.approvedBy !== undefined
  }

  /**
   * Kiểm tra session có temp exam không
   */
  hasTempExam(): boolean {
    return this.tempExam !== null && this.tempExam !== undefined
  }

  /**
   * Kiểm tra session có temp sections không
   */
  hasTempSections(): boolean {
    return Boolean(this.tempSections && this.tempSections.length > 0)
  }

  /**
   * Kiểm tra session có temp questions không
   */
  hasTempQuestions(): boolean {
    return Boolean(this.tempQuestions && this.tempQuestions.length > 0)
  }

  /**
   * Lấy số lượng temp sections
   */
  getTempSectionsCount(): number {
    return this.tempSections?.length || 0
  }

  /**
   * Lấy số lượng temp questions
   */
  getTempQuestionsCount(): number {
    return this.tempQuestions?.length || 0
  }

  /**
   * Lấy trạng thái hiển thị
   */
  getStatusDisplay(): string {
    const statusMap = {
      [ImportStatus.PENDING]: 'Đang chờ xử lý',
      [ImportStatus.PROCESSING]: 'Đang xử lý PDF',
      [ImportStatus.PARSED]: 'Đã parse xong',
      [ImportStatus.REVIEWING]: 'Đang review',
      [ImportStatus.APPROVED]: 'Đã duyệt',
      [ImportStatus.COMPLETED]: 'Hoàn thành',
      [ImportStatus.REJECTED]: 'Bị từ chối',
      [ImportStatus.FAILED]: 'Thất bại',
    }
    return statusMap[this.status] || 'Không xác định'
  }

  /**
   * Kiểm tra session có thể được approved không
   */
  canBeApproved(): boolean {
    return this.isParsed() || this.isReviewing()
  }

  /**
   * Kiểm tra session có thể migrate sang bảng chính không
   */
  canBeMigrated(): boolean {
    return this.isApproved() && this.hasTempExam()
  }

  /**
   * Serialize để gửi qua API
   */
  toJSON() {
    return {
      sessionId: this.sessionId,
      status: this.status,
      rawContent: this.rawContent,
      metadata: this.metadata,
      createdBy: this.createdBy,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed fields
      isPending: this.isPending(),
      isProcessing: this.isProcessing(),
      isParsed: this.isParsed(),
      isReviewing: this.isReviewing(),
      isApproved: this.isApproved(),
      isCompleted: this.isCompleted(),
      isRejected: this.isRejected(),
      isFailed: this.isFailed(),
      hasRawContent: this.hasRawContent(),
      hasApprover: this.hasApprover(),
      hasTempExam: this.hasTempExam(),
      hasTempSections: this.hasTempSections(),
      hasTempQuestions: this.hasTempQuestions(),
      tempSectionsCount: this.getTempSectionsCount(),
      tempQuestionsCount: this.getTempQuestionsCount(),
      statusDisplay: this.getStatusDisplay(),
      canBeApproved: this.canBeApproved(),
      canBeMigrated: this.canBeMigrated(),
      // Relations
      tempExam: this.tempExam ? this.tempExam.toJSON() : undefined,
    }
  }

  /**
   * Tạo entity từ Prisma model data
   */
  static fromPrisma(data: any): ExamImportSession {
    return new ExamImportSession({
      sessionId: data.sessionId,
      status: data.status as ImportStatus,
      rawContent: data.rawContent,
      metadata: data.metadata,
      createdBy: data.createdBy,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      completedAt: data.completedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      tempExam: data.tempExam ? TempExam.fromPrisma(data.tempExam) : undefined,
      tempSections: data.tempSections
        ? data.tempSections.map((s: any) => TempSection.fromPrisma(s))
        : undefined,
      tempQuestions: data.tempQuestions
        ? data.tempQuestions.map((q: any) => TempQuestion.fromPrisma(q))
        : undefined,
    })
  }

  /**
   * So sánh hai entities
   */
  equals(other: ExamImportSession): boolean {
    return this.sessionId === other.sessionId
  }
}
