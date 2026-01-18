// src/domain/entities/admin.entity.ts

import { User } from './user.entity'
import { Subject } from '../subject/subject.entity'

export class Admin {
  // Required properties
  adminId: number
  userId: number

  // Optional properties
  subjectId?: number | null

  // Navigation properties
  user?: User
  subject?: Subject

  constructor(data: {
    adminId: number
    userId: number
    subjectId?: number | null
    user?: User
    subject?: Subject
  }) {
    this.adminId = data.adminId
    this.userId = data.userId
    this.subjectId = data.subjectId
    this.user = data.user
    this.subject = data.subject
  }

  /* ===================== DOMAIN METHODS ===================== */

  /**
   * Có được gán môn học không
   */
  hasSubject(): boolean {
    return this.subjectId !== null && this.subjectId !== undefined
  }

  /**
   * Kiểm tra admin có phụ trách môn học cụ thể không
   */
  isResponsibleForSubject(subjectId: number): boolean {
    return this.subjectId === subjectId
  }

  /**
   * Lấy tên môn học
   */
  getSubjectName(): string {
    return this.subject?.name ?? 'Chưa xác định'
  }

  /**
   * Lấy mã môn học
   */
  getSubjectCode(): string {
    return this.subject?.getSubjectCode() ?? 'N/A'
  }

  /**
   * Hiển thị thông tin môn học đầy đủ
   */
  getSubjectDisplay(): string {
    return this.subject
      ? this.subject.getFullName()
      : 'Chưa được gán môn học'
  }

  /**
   * Lấy tên đầy đủ admin
   */
  getFullName(): string {
    if (!this.user) return `Admin #${this.adminId}`
    return `${this.user.lastName} ${this.user.firstName}`.trim()
  }

  /**
   * Email admin
   */
  getEmail(): string | undefined {
    return this.user?.email
  }

  /**
   * Admin còn hoạt động không
   */
  isActive(): boolean {
    return this.user?.isActive ?? false
  }

  equals(other: Admin): boolean {
    return this.adminId === other.adminId
  }

  toJSON() {
    return {
      adminId: this.adminId,
      userId: this.userId,
      subjectId: this.subjectId,
      fullName: this.getFullName(),
      email: this.getEmail(),
      isActive: this.isActive(),
      subject: this.subject ? this.subject.toJSON() : undefined,
    }
  }

  clone(): Admin {
    return new Admin({
      adminId: this.adminId,
      userId: this.userId,
      subjectId: this.subjectId,
      user: this.user,
      subject: this.subject,
    })
  }

  /* ===================== FACTORIES ===================== */

  /**
   * Tạo admin cơ bản (không cần relation)
   */
  static createBasic(
    adminId: number,
    userId: number,
    subjectId?: number,
  ): Admin {
    return new Admin({
      adminId,
      userId,
      subjectId,
    })
  }

  /**
   * Adapter từ Prisma (giữ ở domain cho tiện, nhưng không lạm dụng)
   */
  static fromPrisma(data: any): Admin {
    return new Admin({
      adminId: data.adminId,
      userId: data.userId,
      subjectId: data.subjectId,
      user: data.user,
      subject: data.subject
        ? Subject.fromPrisma(data.subject)
        : undefined,
    })
  }
}
