// src/domain/entities/student.entity.ts

import { User } from './user.entity'
import { ConversationMode, StudentType } from '../../../shared/enums'

export class Student {
  // Required properties
  studentId: number
  userId: number

  grade: number
  totalPoint: number
  studentType: StudentType

  // Optional properties
  studentPhone?: string
  parentPhone?: string
  studentZaloId?: string
  parentZaloId?: string
  school?: string
  highSchoolGraduationYear?: number

  conversationMode: ConversationMode
  lastAdminReplyAt?: Date

  // Navigation properties
  user?: User

  constructor(data: {
    studentId: number
    userId: number
    grade: number
    totalPoint?: number
    studentType?: StudentType
    studentPhone?: string
    parentPhone?: string
    studentZaloId?: string
    parentZaloId?: string
    school?: string
    highSchoolGraduationYear?: number
    user?: User
    conversationMode?: ConversationMode
    lastAdminReplyAt?: Date
  }) {
    this.studentId = data.studentId
    this.userId = data.userId
    this.grade = data.grade
    this.totalPoint = data.totalPoint ?? 0
    this.studentType = data.studentType ?? StudentType.OFFLINE
    this.studentPhone = data.studentPhone
    this.parentPhone = data.parentPhone
    this.studentZaloId = data.studentZaloId
    this.parentZaloId = data.parentZaloId
    this.school = data.school
    this.highSchoolGraduationYear = data.highSchoolGraduationYear
    this.user = data.user
    this.conversationMode = data.conversationMode ?? ConversationMode.BOT
    this.lastAdminReplyAt = data.lastAdminReplyAt
  }

  /* ===================== DOMAIN METHODS ===================== */

  hasStudentPhone(): boolean {
    return Boolean(this.studentPhone)
  }

  hasParentPhone(): boolean {
    return Boolean(this.parentPhone)
  }

  getSchoolDisplay(): string {
    return this.school ?? 'Chưa xác định'
  }

  getGradeDisplay(): string {
    return `Lớp ${this.grade}`
  }

  getFullName(): string {
    return this.user?.getFullName() ?? `Student #${this.studentId}`
  }

  getEmail(): string | undefined {
    return this.user?.email
  }

  isActive(): boolean {
    return this.user?.isActive ?? false
  }

  equals(other: Student): boolean {
    return this.studentId === other.studentId
  }

  toJSON() {
    return {
      studentId: this.studentId,
      userId: this.userId,
      grade: this.grade,
      totalPoint: this.totalPoint,
      studentType: this.studentType,
      studentPhone: this.studentPhone,
      parentPhone: this.parentPhone,
      studentZaloId: this.studentZaloId,
      parentZaloId: this.parentZaloId,
      school: this.school,
      highSchoolGraduationYear: this.highSchoolGraduationYear,
      fullName: this.getFullName(),
      email: this.getEmail(),
      isActive: this.isActive(),
      conversationMode: this.conversationMode,
      lastAdminReplyAt: this.lastAdminReplyAt,
    }
  }

  clone(): Student {
    return new Student({
      studentId: this.studentId,
      userId: this.userId,
      grade: this.grade,
      totalPoint: this.totalPoint,
      studentType: this.studentType,
      studentPhone: this.studentPhone,
      parentPhone: this.parentPhone,
      studentZaloId: this.studentZaloId,
      parentZaloId: this.parentZaloId,
      school: this.school,
      highSchoolGraduationYear: this.highSchoolGraduationYear,
      user: this.user,
      conversationMode: this.conversationMode,
      lastAdminReplyAt: this.lastAdminReplyAt,
    })
  }
}
