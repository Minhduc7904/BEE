import { Trim } from '../../../shared/decorators/trim.decorator'
import { IsOptionalString, IsOptionalDate, IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO cập nhật lớp học
 * @description Chứa các trường có thể cập nhật của lớp học
 */
export class UpdateCourseClassDto {
  /**
   * Tên lớp học (3-100 ký tự)
   * @optional
   * @example "Lớp Toán 10A"
   */
  @IsOptionalString('Tên lớp học', 100, 3)
  className?: string

  /**
   * Ngày bắt đầu
   * @optional
   * @example "2024-01-15"
   */
  @IsOptionalDate('Ngày bắt đầu')
  startDate?: string | null

  /**
   * Ngày kết thúc
   * @optional
   * @example "2024-06-30"
   */
  @IsOptionalDate('Ngày kết thúc')
  endDate?: string | null

  /**
   * Phòng học (tối đa 100 ký tự)
   * @optional
   * @example "Phòng A101"
   */
  @IsOptionalString('Phòng học', 100)
  room?: string | null

  /**
   * ID giáo viên
   * @optional
   * @example 3
   */
  @IsOptionalIdNumber('ID giáo viên')
  instructorId?: number | null
}
