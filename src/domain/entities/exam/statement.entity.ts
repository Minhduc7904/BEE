// src/domain/entities/exam/statement.entity.ts

import { Difficulty } from '../../../shared/enums/difficulty.enum'
import { Question } from './question.entity'

export class Statement {
  // Required properties
  statementId: number
  content: string
  questionId: number
  isCorrect: boolean
  createdAt: Date
  updatedAt: Date

  // Optional properties
  order?: number | null
  difficulty?: Difficulty | null

  // Relations (optional - sẽ được populate khi cần)
  question?: Question

  constructor(data: {
    statementId: number
    content: string
    questionId: number
    isCorrect: boolean
    createdAt: Date
    updatedAt: Date
    order?: number | null
    difficulty?: Difficulty | null
    question?: Question
  }) {
    this.statementId = data.statementId
    this.content = data.content
    this.questionId = data.questionId
    this.isCorrect = data.isCorrect
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.order = data.order
    this.difficulty = data.difficulty
    this.question = data.question
  }

  // Validation methods
  hasOrder(): boolean {
    return this.order !== undefined && this.order !== null
  }

  hasDifficulty(): boolean {
    return this.difficulty !== null && this.difficulty !== undefined
  }

  hasQuestion(): boolean {
    return !!this.question
  }

  // Display methods
  getContentDisplay(): string {
    return this.content || 'Nội dung câu trả lời trống'
  }

  getOrderDisplay(): string {
    return this.hasOrder() ? `${this.order}` : 'Chưa sắp xếp'
  }

  getDifficultyDisplay(): string {
    if (!this.difficulty) return 'Chưa xác định độ khó'

    const difficultyMap = {
      [Difficulty.TH]: 'Thông hiểu',
      [Difficulty.NB]: 'Nhận biết',
      [Difficulty.VD]: 'Vận dụng',
      [Difficulty.VDC]: 'Vận dụng cao',
    }
    return difficultyMap[this.difficulty] || 'Không xác định'
  }

  getStatusDisplay(): string {
    return this.isCorrect ? 'Đáp án đúng' : 'Đáp án sai'
  }

  // Type checking methods
  isCorrectAnswer(): boolean {
    return this.isCorrect
  }

  isIncorrectAnswer(): boolean {
    return !this.isCorrect
  }

  // Difficulty checking methods
  isBasicLevel(): boolean {
    return this.difficulty === Difficulty.NB || this.difficulty === Difficulty.TH
  }

  isAdvancedLevel(): boolean {
    return this.difficulty === Difficulty.VD || this.difficulty === Difficulty.VDC
  }

  // Business logic methods
  belongsToQuestion(questionId: number): boolean {
    return this.questionId === questionId
  }

  isValid(): boolean {
    return !!this.content.trim()
  }

  canBeDisplayed(): boolean {
    return this.isValid()
  }

  // Order comparison methods
  isBefore(other: Statement): boolean {
    if (!this.hasOrder() || !other.hasOrder()) return false
    return this.order! < other.order!
  }

  isAfter(other: Statement): boolean {
    if (!this.hasOrder() || !other.hasOrder()) return false
    return this.order! > other.order!
  }

  hasSameOrder(other: Statement): boolean {
    if (!this.hasOrder() || !other.hasOrder()) return false
    return this.order === other.order
  }

  // Date methods
  isCreatedAfter(date: Date): boolean {
    return this.createdAt > date
  }

  wasUpdatedRecently(daysAgo: number = 7): boolean {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - daysAgo)
    return this.updatedAt > threshold
  }

  // Static helper methods for collections
  static sortByOrder(statements: Statement[]): Statement[] {
    return statements.sort((a, b) => {
      if (!a.hasOrder() && !b.hasOrder()) return 0
      if (!a.hasOrder()) return 1
      if (!b.hasOrder()) return -1
      return a.order! - b.order!
    })
  }

  static getCorrectStatements(statements: Statement[]): Statement[] {
    return statements.filter((s) => s.isCorrectAnswer())
  }

  static getIncorrectStatements(statements: Statement[]): Statement[] {
    return statements.filter((s) => s.isIncorrectAnswer())
  }
}
