import { Trim, IsEnumValue } from '../../../shared/decorators'
import { CourseEnrollmentStatus } from 'src/shared/enums'
import { IsOptionalEnumValue } from 'src/shared/decorators/validate'

/**
 * DTO cập nhật đăng ký khóa học
 * @description Chứa các trường có thể cập nhật của đăng ký khóa học
 */
export class UpdateCourseEnrollmentDto {
  /**
   * Trạng thái đăng ký
   * @optional
   * @example "COMPLETED"
   */
  @IsOptionalEnumValue(CourseEnrollmentStatus, 'Trạng thái')
  status?: CourseEnrollmentStatus
}
