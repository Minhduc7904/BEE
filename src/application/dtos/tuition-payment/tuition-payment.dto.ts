import { TuitionPayment } from '../../../domain/entities/tuition-payment/tuition-payment.entity'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { TuitionPaymentStatus } from 'src/shared/enums'
import { StudentResponseDto } from '../student/student.dto'
import { CourseResponseDto } from '../course/course.dto'

export class TuitionPaymentResponseDto {
  paymentId: number
  studentId: number
  courseId?: number | null
  month?: number | null
  year?: number | null

  status: TuitionPaymentStatus
  statusLabel: string

  paidAt?: Date | null
  notes?: string | null

  createdAt: Date
  updatedAt?: Date

  student?: StudentResponseDto | null
  course?: CourseResponseDto | null

  constructor(payment: TuitionPayment) {
    this.paymentId = payment.paymentId
    this.studentId = payment.studentId
    this.courseId = payment.courseId ?? null
    this.month = payment.month ?? null
    this.year = payment.year ?? null

    this.status = payment.status
    this.statusLabel = payment.getStatusLabel()

    this.paidAt = payment.paidAt ?? null
    this.notes = payment.notes ?? null

    this.createdAt = payment.createdAt
    this.updatedAt = payment.updatedAt

    if (payment.student) {
      this.student = StudentResponseDto.fromStudentEntity(payment.student)
    }

    if (payment.course) {
      this.course = CourseResponseDto.fromEntity(payment.course)
    }
  }

  static fromEntity(payment: TuitionPayment): TuitionPaymentResponseDto {
    return new TuitionPaymentResponseDto(payment)
  }
}

export class TuitionPaymentListResponseDto extends PaginationResponseDto<TuitionPaymentResponseDto> {
  constructor(data: TuitionPaymentResponseDto[], page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit)

    const meta = {
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
      previousPage: page > 1 ? page - 1 : undefined,
      nextPage: page < totalPages ? page + 1 : undefined,
    }

    super(true, 'Lấy danh sách học phí thành công', data, meta)
  }
}
