import { Trim } from '../../../shared/decorators/trim.decorator'
import { IsRequiredIdNumber, IsRequiredString, IsOptionalDate, IsOptionalString, IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO tạo lớp học mới
 * @description Chứa thông tin để tạo lớp học trong khóa học
 */
export class CreateCourseClassDto {
  /**
   * ID khóa học
   * @required
   * @example 5
   */
  @IsRequiredIdNumber('ID khóa học')
  courseId: number

  /**
   * Tên lớp học (3-100 ký tự)
   * @required
   * @example "Lớp Toán 10A"
   */
  @IsRequiredString('Tên lớp học', 100, 3)
  className: string

  /**
   * Ngày bắt đầu
   * @optional
   * @example "2024-01-15"
   */
  @IsOptionalDate('Ngày bắt đầu')
  startDate?: string

  /**
   * Ngày kết thúc
   * @optional
   * @example "2024-06-30"
   */
  @IsOptionalDate('Ngày kết thúc')
  endDate?: string

  /**
   * Phòng học (tối đa 100 ký tự)
   * @optional
   * @example "Phòng A101"
   */
  @IsOptionalString('Phòng học', 100)
  room?: string

  /**
   * ID giáo viên
   * @optional
   * @example 3
   */
  @IsOptionalIdNumber('ID giáo viên')
  instructorId?: number
}
