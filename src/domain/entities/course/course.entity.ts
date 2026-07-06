// src/domain/entities/course/course.entity.ts

import { CourseType, CourseVisibility } from '../../../shared/enums'
import { Subject } from '../subject/subject.entity'
import { Admin } from '../user/admin.entity'
import { Lesson } from '../lesson/lesson.entity'
import { CourseClass } from '../course-class'
import { CourseEnrollment } from '../course-enrollment'
import { TuitionPayment } from '../tuition-payment'

export class Course {
  // Required properties
  courseId: number
  code: string
  title: string
  priceVND: number
  visibility: CourseVisibility
  isEnded: boolean
  courseType: CourseType
  createdAt: Date
  updatedAt: Date

  // Optional properties
  subtitle?: string | null
  academicYear?: string | null
  grade?: number | null
  subjectId?: number | null
  description?: string | null
  compareAtVND?: number | null
  teacherId?: number | null

  // Navigation properties
  subject?: Subject | null
  teacher?: Admin | null
  lessons?: Lesson[]
  courseClasses?: CourseClass[]
  courseEnrollments?: CourseEnrollment[]
  tuitionPayments?: TuitionPayment[]

  constructor(data: {
    courseId: number
    code: string
    title: string
    priceVND: number
    visibility: CourseVisibility
    isEnded?: boolean
    courseType?: CourseType
    createdAt?: Date
    updatedAt?: Date
    subtitle?: string | null
    academicYear?: string | null
    grade?: number | null
    subjectId?: number | null
    description?: string | null
    compareAtVND?: number | null
    teacherId?: number | null
    subject?: Subject | null
    teacher?: Admin | null
    lessons?: Lesson[]
    courseClasses?: CourseClass[]
    courseEnrollments?: CourseEnrollment[]
    tuitionPayments?: TuitionPayment[]
  }) {
    this.courseId = data.courseId
    this.code = data.code
    this.title = data.title
    this.priceVND = data.priceVND
    this.visibility = data.visibility
    this.isEnded = data.isEnded ?? false
    this.courseType = data.courseType ?? CourseType.OFFLINE
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()

    this.subtitle = data.subtitle
    this.academicYear = data.academicYear
    this.grade = data.grade
    this.subjectId = data.subjectId
    this.description = data.description
    this.compareAtVND = data.compareAtVND
    this.teacherId = data.teacherId

    this.subject = data.subject
    this.teacher = data.teacher
    this.lessons = data.lessons
    this.courseClasses = data.courseClasses
    this.courseEnrollments = data.courseEnrollments
    this.tuitionPayments = data.tuitionPayments
  }

  /* ===================== BUSINESS METHODS ===================== */

  isDraft(): boolean {
    return this.visibility === CourseVisibility.DRAFT
  }

  isPublished(): boolean {
    return this.visibility === CourseVisibility.PUBLISHED
  }

  isPrivate(): boolean {
    return this.visibility === CourseVisibility.PRIVATE
  }

  isOnline(): boolean {
    return this.courseType === CourseType.ONLINE || this.courseType === CourseType.ALL
  }

  isOffline(): boolean {
    return this.courseType === CourseType.OFFLINE || this.courseType === CourseType.ALL
  }

  canUpdate(): boolean {
    return true
  }

  isFree(): boolean {
    return this.priceVND === 0
  }

  hasDiscount(): boolean {
    return this.compareAtVND !== null && this.compareAtVND !== undefined && this.compareAtVND > this.priceVND
  }

  getDiscountPercentage(): number {
    if (!this.hasDiscount()) return 0
    return Math.round(((this.compareAtVND! - this.priceVND) / this.compareAtVND!) * 100)
  }

  getDisplayTitle(): string {
    return this.subtitle ? `${this.title} - ${this.subtitle}` : this.title
  }

  getPriceDisplay(): string {
    if (this.isFree()) return 'Miá»…n phÃ­'
    return `${this.priceVND.toLocaleString('vi-VN')} VNÄ`
  }

  equals(other: Course): boolean {
    return this.courseId === other.courseId
  }

  toJSON() {
    return {
      courseId: this.courseId,
      title: this.title,
      subtitle: this.subtitle,
      academicYear: this.academicYear,
      grade: this.grade,
      subjectId: this.subjectId,
      description: this.description,
      priceVND: this.priceVND,
      compareAtVND: this.compareAtVND,
      visibility: this.visibility,
      isEnded: this.isEnded,
      courseType: this.courseType,
      teacherId: this.teacherId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  clone(): Course {
    return new Course({
      courseId: this.courseId,
      title: this.title,
      code: this.code,
      priceVND: this.priceVND,
      visibility: this.visibility,
      isEnded: this.isEnded,
      courseType: this.courseType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      subtitle: this.subtitle,
      academicYear: this.academicYear,
      grade: this.grade,
      subjectId: this.subjectId,
      description: this.description,
      compareAtVND: this.compareAtVND,
      teacherId: this.teacherId,
      subject: this.subject,
      teacher: this.teacher,
      lessons: this.lessons,
      courseClasses: this.courseClasses,
      courseEnrollments: this.courseEnrollments,
      tuitionPayments: this.tuitionPayments,
    })
  }
}
