// src/domain/entities/exam-import/temp-statement.entity.ts

import { Difficulty } from '../../../shared/enums'
import { TempQuestion } from './temp-question.entity'

export class TempStatement {
  // Required properties
  tempStatementId: string
  tempQuestionId: string
  content: string
  isCorrect: boolean
  createdAt: Date
  updatedAt: Date

  // Optional properties
  order?: number | null
  difficulty?: Difficulty | null
  metadata?: any | null
  statementId?: number | null

  // Relations
  tempQuestion?: TempQuestion | null
  finalStatement?: any | null // Statement entity

  constructor(data: {
    tempStatementId: string
    tempQuestionId: string
    content: string
    isCorrect: boolean
    createdAt: Date
    updatedAt: Date
    order?: number | null
    difficulty?: Difficulty | null
    metadata?: any | null
    statementId?: number | null
    tempQuestion?: TempQuestion | null
    finalStatement?: any | null
  }) {
    this.tempStatementId = data.tempStatementId
    this.tempQuestionId = data.tempQuestionId
    this.content = data.content
    this.isCorrect = data.isCorrect
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.order = data.order
    this.difficulty = data.difficulty
    this.metadata = data.metadata
    this.statementId = data.statementId
    this.tempQuestion = data.tempQuestion
    this.finalStatement = data.finalStatement
  }

  /**
   * Kiểm tra có order không
   */
  hasOrder(): boolean {
    return this.order !== null && this.order !== undefined
  }

  /**
   * Kiểm tra có difficulty không
   */
  hasDifficulty(): boolean {
    return this.difficulty !== null && this.difficulty !== undefined
  }

  /**
   * Kiểm tra đã migrate sang bảng chính chưa
   */
  isMigrated(): boolean {
    return this.statementId !== null && this.statementId !== undefined
  }

  /**
   * Lấy difficulty display
   */
  getDifficultyDisplay(): string {
    if (!this.difficulty) return 'Chưa xác định'
    const difficultyMap = {
      [Difficulty.TH]: 'Thông hiểu',
      [Difficulty.NB]: 'Nhận biết',
      [Difficulty.VD]: 'Vận dụng',
      [Difficulty.VDC]: 'Vận dụng cao',
    }
    return difficultyMap[this.difficulty] || 'Không xác định'
  }

  /**
   * Lấy trạng thái đúng/sai
   */
  getCorrectDisplay(): string {
    return this.isCorrect ? 'Đúng' : 'Sai'
  }

  /**
   * Serialize để gửi qua API
   */
  toJSON() {
    return {
      tempStatementId: this.tempStatementId,
      tempQuestionId: this.tempQuestionId,
      content: this.content,
      isCorrect: this.isCorrect,
      order: this.order,
      difficulty: this.difficulty,
      metadata: this.metadata,
      statementId: this.statementId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed fields
      hasOrder: this.hasOrder(),
      hasDifficulty: this.hasDifficulty(),
      isMigrated: this.isMigrated(),
      difficultyDisplay: this.getDifficultyDisplay(),
      correctDisplay: this.getCorrectDisplay(),
    }
  }

  /**
   * Tạo entity từ Prisma model data
   */
  static fromPrisma(data: any): TempStatement {
    return new TempStatement({
      tempStatementId: data.tempStatementId,
      tempQuestionId: data.tempQuestionId,
      content: data.content,
      isCorrect: data.isCorrect,
      order: data.order,
      difficulty: data.difficulty as Difficulty,
      metadata: data.metadata,
      statementId: data.statementId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      tempQuestion: data.tempQuestion,
      finalStatement: data.finalStatement,
    })
  }

  /**
   * So sánh hai entities
   */
  equals(other: TempStatement): boolean {
    return this.tempStatementId === other.tempStatementId
  }
}
