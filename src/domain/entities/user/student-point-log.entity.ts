// src/domain/entities/user/student-point-log.entity.ts

import { Student } from './student.entity'
import { PointType } from '../../../shared/enums/point-type.enum'

export class StudentPointLog {
  // Required properties
  pointLogId: number
  studentId: number
  type: PointType
  points: number
  source: string
  createdAt: Date

  // Optional properties
  referenceType?: string
  referenceId?: number
  note?: string
  metadata?: any

  // Navigation properties
  student?: Student

  constructor(data: {
    pointLogId: number
    studentId: number
    type: PointType
    points: number
    source: string
    createdAt?: Date
    referenceType?: string
    referenceId?: number
    note?: string
    metadata?: any
    student?: Student
  }) {
    this.pointLogId = data.pointLogId
    this.studentId = data.studentId
    this.type = data.type
    this.points = data.points
    this.source = data.source
    this.createdAt = data.createdAt || new Date()

    this.referenceType = data.referenceType
    this.referenceId = data.referenceId
    this.note = data.note
    this.metadata = data.metadata
    this.student = data.student
  }

  /* ===================== DOMAIN METHODS ===================== */

  isBonus(): boolean {
    return this.type === PointType.BONUS
  }

  isPenalty(): boolean {
    return this.type === PointType.PENALTY
  }

  /**
   * Điểm có dấu (+ / -)
   */
  getSignedPoints(): number {
    return this.isPenalty() ? -this.points : this.points
  }

  /**
   * Mô tả đầy đủ log
   */
  getFullDescription(): string {
    const sign = this.isBonus() ? '+' : '-'
    const base = `${sign}${this.points} điểm từ ${this.source}`
    return this.note ? `${base}: ${this.note}` : base
  }

  getTypeDisplay(): string {
    return this.isBonus() ? 'Thưởng' : 'Phạt'
  }

  /**
   * Màu trạng thái (phục vụ UI, nhưng logic vẫn ở domain)
   */
  getTypeColor(): 'success' | 'danger' {
    return this.isBonus() ? 'success' : 'danger'
  }

  hasNote(): boolean {
    return Boolean(this.note && this.note.trim().length > 0)
  }

  formatPoints(): string {
    const sign = this.isBonus() ? '+' : '-'
    return `${sign}${this.points}`
  }

  isFromSource(sourceName: string): boolean {
    return this.source.toLowerCase() === sourceName.toLowerCase()
  }

  getSummary(): string {
    return `${this.getTypeDisplay()}: ${this.formatPoints()} - ${this.source}`
  }

  equals(other: StudentPointLog): boolean {
    return this.pointLogId === other.pointLogId
  }

  toJSON() {
    return {
      pointLogId: this.pointLogId,
      studentId: this.studentId,
      type: this.type,
      points: this.points,
      source: this.source,
      referenceType: this.referenceType,
      referenceId: this.referenceId,
      note: this.note,
      metadata: this.metadata,
      createdAt: this.createdAt,
    }
  }

  clone(): StudentPointLog {
    return new StudentPointLog({
      pointLogId: this.pointLogId,
      studentId: this.studentId,
      type: this.type,
      points: this.points,
      source: this.source,
      referenceType: this.referenceType,
      referenceId: this.referenceId,
      note: this.note,
      metadata: this.metadata,
      createdAt: this.createdAt,
      student: this.student,
    })
  }
}
