import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { CourseVisibility, PaymentType } from 'src/shared/enums'
import { IsOptionalString, IsOptionalInt, IsOptionalIdNumber, IsOptionalEnumValue, IsOptionalNumber, IsOptionalBoolean } from 'src/shared/decorators/validate'

/**
 * DTO cập nhật thông tin cơ bản khóa học
 * @description Chứa các trường thông tin cơ bản có thể cập nhật
 */
export class UpdateCourseBasicInfoDto {
  /**
   * Tiêu đề khóa học (3-200 ký tự)
   * @optional
   * @example "Toán học lớp 10"
   */
  @IsOptionalString('Tiêu đề', 200, 3)
  title?: string

  /**
   * Phụ đề khóa học (tối đa 255 ký tự)
   * @optional
   * @example "Cơ bản và nâng cao"
   */
  @IsOptionalString('Phụ đề', 255)
  subtitle?: string

  /**
   * Năm học (tối đa 9 ký tự)
   * @optional
   * @example "2024-2025"
   */
  @IsOptionalString('Năm học', 9)
  academicYear?: string

  /**
   * Khối lớp (1-12)
   * @optional
   * @example 10
   */
  @IsOptionalInt('Khối', 1, 12)
  grade?: number

  /**
   * ID môn học
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('Môn học')
  subjectId?: number

  /**
   * Mô tả khóa học
   * @optional
   */
  @IsOptionalString('Mô tả')
  description?: string

  /**
   * Trạng thái hiển thị
   * @optional
   */
  @IsOptionalEnumValue(CourseVisibility, 'Trạng thái')
  visibility?: CourseVisibility

  /**
   * ID giáo viên
   * @optional
   */
  @IsOptionalIdNumber('Giáo viên')
  teacherId?: number
}

/**
 * DTO cập nhật thông tin giá cả khóa học
 * @description Chứa các trường về giá, thanh toán, học phí
 */
export class UpdateCoursePricingDto {
  /**
   * Giá khóa học (VNĐ)
   * @optional
   * @example 500000
   */
  @IsOptionalNumber('Giá', 0)
  priceVND?: number

  /**
   * Giá gốc (VNĐ)
   * @optional
   * @example 700000
   */
  @IsOptionalNumber('Giá gốc', 0)
  compareAtVND?: number

  /**
   * Có thu học phí không
   * @optional
   * @example true
   */
  @IsOptionalBoolean('Có thu học phí')
  hasTuitionFee?: boolean

  /**
   * Loại thanh toán
   * @optional
   * @example "MONTHLY"
   */
  @IsOptionalEnumValue(PaymentType, 'Loại thanh toán')
  paymentType?: PaymentType

  /**
   * Tự động gia hạn
   * @optional
   * @example true
   */
  @IsOptionalBoolean('Tự động gia hạn')
  autoRenew?: boolean

  /**
   * Chặn học khi chưa đóng phí
   * @optional
   * @example false
   */
  @IsOptionalBoolean('Chặn học khi chưa đóng phí')
  blockUnpaid?: boolean

  /**
   * Số ngày ân hạn
   * @optional
   * @example 7
   */
  @IsOptionalNumber('Số ngày ân hạn', 0)
  gracePeriodDays?: number | null
}
