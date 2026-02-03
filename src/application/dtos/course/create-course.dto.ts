// src/application/dtos/course/create-course.dto.ts
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { CourseVisibility } from 'src/shared/enums'
import { IsRequiredString, IsOptionalString, IsOptionalInt, IsRequiredNumber, IsOptionalNumber, IsOptionalEnumValue, IsOptionalIdNumber } from 'src/shared/decorators/validate'
/**
 * DTO tạo khóa học mới
 * @description Chứa thông tin cơ bản để tạo khóa học mới
 */
export class CreateCourseDto {
  /**
   * Tiêu đề khóa học (3-200 ký tự)
   * @required
   * @example "Toán học lớp 10"
   */
  @IsRequiredString('Tiêu đề', 200, 3)
  title: string

  /**
   * Phụ đề khóa học (tối đa 255 ký tự)
   * @optional
   * @example "Cơ bản và nâng cao"
   */
  @IsOptionalString('Phụ đề', 255)
  subtitle?: string

  /**
   * Năm học (tối đa 9 ký tự, format: YYYY-YYYY)
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
   * @example "Khóa học toán cơ bản và nâng cao cho học sinh lớp 10"
   */
  @IsOptionalString('Mô tả')
  description?: string

  /**
   * Giá khóa học (VNĐ, ≥ 0)
   * @required
   * @example 500000
   */
  @IsRequiredNumber('Giá', 0)
  priceVND: number

  /**
   * Giá gốc trước khi giảm (VNĐ, ≥ 0)
   * @optional
   * @example 700000
   */
  @IsOptionalNumber('Giá gốc', 0)
  compareAtVND?: number

  /**
   * Trạng thái hiển thị khóa học
   * @optional
   * @example "PUBLIC"
   */
  @IsOptionalEnumValue(CourseVisibility, 'Trạng thái')
  visibility?: CourseVisibility

  /**
   * ID giáo viên phụ trách
   * @optional
   * @example 3
   */
  @IsOptionalIdNumber('Giáo viên')
  teacherId?: number
}
