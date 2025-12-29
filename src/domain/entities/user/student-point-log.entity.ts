// src/domain/entities/user/student-point-log.entity.ts

import { Student } from './student.entity'

export enum PointType {
  BONUS = 'BONUS',
  PENALTY = 'PENALTY',
}

export class StudentPointLog {
  id: number
  studentId: number
  type: PointType
  points: number
  source: string
  note?: string
  createdAt: Date

  // Navigation properties
  student?: Student

  constructor(
    id: number,
    studentId: number,
    type: PointType,
    points: number,
    source: string,
    note?: string,
    createdAt?: Date,
    student?: Student,
  ) {
    this.id = id
    this.studentId = studentId
    this.type = type
    this.points = points
    this.source = source
    this.note = note
    this.createdAt = createdAt || new Date()
    this.student = student
  }

  /**
   * Kiểm tra xem có phải là điểm thưởng không
   */
  isBonus(): boolean {
    return this.type === PointType.BONUS
  }

  /**
   * Kiểm tra xem có phải là điểm phạt không
   */
  isPenalty(): boolean {
    return this.type === PointType.PENALTY
  }

  /**
   * Lấy điểm có dấu (+ hoặc -)
   */
  getSignedPoints(): number {
    return this.isPenalty() ? -this.points : this.points
  }

  /**
   * Lấy mô tả đầy đủ của log
   */
  getFullDescription(): string {
    const sign = this.isBonus() ? '+' : '-'
    const baseDesc = `${sign}${this.points} điểm từ ${this.source}`
    return this.note ? `${baseDesc}: ${this.note}` : baseDesc
  }

  /**
   * Lấy loại điểm hiển thị
   */
  getTypeDisplay(): string {
    return this.isBonus() ? 'Thưởng' : 'Phạt'
  }

  /**
   * Lấy màu sắc cho loại điểm (dùng cho UI)
   */
  getTypeColor(): string {
    return this.isBonus() ? 'success' : 'danger'
  }

  /**
   * Kiểm tra xem log có ghi chú không
   */
  hasNote(): boolean {
    return !!this.note
  }

  /**
   * Format điểm số để hiển thị
   */
  formatPoints(): string {
    const sign = this.isBonus() ? '+' : '-'
    return `${sign}${this.points}`
  }

  /**
   * Kiểm tra log có từ nguồn cụ thể không
   */
  isFromSource(sourceName: string): boolean {
    return this.source.toLowerCase() === sourceName.toLowerCase()
  }

  /**
   * Lấy thông tin tóm tắt
   */
  getSummary(): string {
    return `${this.getTypeDisplay()}: ${this.formatPoints()} - ${this.source}`
  }
}
