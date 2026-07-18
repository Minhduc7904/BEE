// src/application/dtos/course/student-course-detail.dto.ts
import { Course } from '../../../domain/entities'
import type { PublicSeoCourseMediaDto } from './public-seo-course.dto'

export class StudentCourseDetailResponseDto {
  // ===== Identity =====
  courseId: number

  // ===== Basic info =====
  title: string
  subtitle?: string
  academicYear?: string
  grade?: number
  description?: string

  // ===== Subject =====
  subjectId?: number
  subjectName?: string

  // ===== Teacher =====
  teacherId?: number
  teacherName?: string
  teacherFirstName?: string
  teacherLastName?: string
  teacherEmail?: string
  teacherAvatarUrl?: string

  // ===== Pricing =====
  priceVND: number
  compareAtVND?: number

  // ===== Audit =====
  createdAt: Date
  updatedAt: Date

  // ===== State =====
  isEnded: boolean
  courseType: string

  // ===== Computed =====
  isFree: boolean
  hasDiscount: boolean
  discountPercentage?: number

  // ===== Media =====
  media: PublicSeoCourseMediaDto

  // ===== Enrollment info =====
  isEnrolled: boolean
  enrolledAt?: Date
  enrollmentStatus?: string
  isPaidFull?: boolean

  static fromEntity(
    course: Course,
    enrollmentInfo?: {
      isEnrolled: boolean
      enrolledAt?: Date
      status?: string
      isPaidFull?: boolean
      media: PublicSeoCourseMediaDto
      teacherAvatarUrl?: string
    },
  ): StudentCourseDetailResponseDto {
    return {
      // Identity
      courseId: course.courseId,

      // Basic info
      title: course.title,
      subtitle: course.subtitle ?? undefined,
      academicYear: course.academicYear ?? undefined,
      grade: course.grade ?? undefined,
      description: course.description ?? undefined,

      // Subject
      subjectId: course.subjectId ?? undefined,
      subjectName: course.subject?.name,

      // Teacher
      teacherId: course.teacherId ?? undefined,
      teacherName: course.teacher
        ? `${course.teacher.user?.firstName ?? ''} ${course.teacher.user?.lastName ?? ''}`.trim()
        : undefined,
      teacherFirstName: course.teacher?.user?.firstName,
      teacherLastName: course.teacher?.user?.lastName,
      teacherEmail: course.teacher?.user?.email ?? undefined,
      teacherAvatarUrl: enrollmentInfo?.teacherAvatarUrl,

      // Pricing
      priceVND: course.priceVND,
      compareAtVND: course.compareAtVND ?? undefined,

      // Audit
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,

      // State
      isEnded: course.isEnded,
      courseType: course.courseType,

      // Computed
      isFree: course.isFree(),
      hasDiscount: course.hasDiscount(),
      discountPercentage: course.getDiscountPercentage(),

      // Media
      media: enrollmentInfo?.media ?? { gallery: [] },

      // Enrollment info
      isEnrolled: enrollmentInfo?.isEnrolled ?? false,
      enrolledAt: enrollmentInfo?.enrolledAt,
      enrollmentStatus: enrollmentInfo?.status,
      isPaidFull: enrollmentInfo?.isPaidFull,
    }
  }
}
