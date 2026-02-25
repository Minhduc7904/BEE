// src/application/dtos/course/course.dto.ts
import { Course } from '../../../domain/entities'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'

export class CourseResponseDto {
  // ===== Identity =====
  courseId: number
  code: string

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

  // ===== Pricing =====
  priceVND: number
  compareAtVND?: number
  hasTuitionFee: boolean
  paymentType: string
  autoRenew: boolean
  blockUnpaid: boolean
  gracePeriodDays?: number

  // ===== State / config =====
  visibility: string

  // ===== Audit =====
  createdAt: Date
  updatedAt: Date

  // ===== Computed =====
  isFree: boolean
  hasDiscount: boolean
  discountPercentage?: number

  static fromEntity(course: Course): CourseResponseDto {
    return {
      // Identity
      courseId: course.courseId,
      code: course.code,

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

      // Pricing
      priceVND: course.priceVND,
      compareAtVND: course.compareAtVND ?? undefined,
      hasTuitionFee: course.hasTuitionFee,
      paymentType: course.paymentType,
      autoRenew: course.autoRenew,
      blockUnpaid: course.blockUnpaid,
      gracePeriodDays: course.gracePeriodDays ?? undefined,

      // State / config
      visibility: course.visibility,

      // Audit
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,

      // Computed
      isFree: course.isFree(),
      hasDiscount: course.hasDiscount(),
      discountPercentage: course.getDiscountPercentage(),
    }
  }

  static fromEntities(courses: Course[]): CourseResponseDto[] {
    return courses.map((course) => this.fromEntity(course))
  }
}

export class CourseListResponseDto extends PaginationResponseDto<CourseResponseDto> {
  constructor(data: CourseResponseDto[], page: number, limit: number, total: number) {
    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasPrevious: page > 1,
      hasNext: page < Math.ceil(total / limit),
      previousPage: page > 1 ? page - 1 : undefined,
      nextPage: page < Math.ceil(total / limit) ? page + 1 : undefined,
    }
    super(true, 'Lấy danh sách khóa học thành công', data, meta)
  }
}
