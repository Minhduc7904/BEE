import { Trim, IsEnumValue } from '../../../shared/decorators'
import { CourseEnrollmentStatus } from 'src/shared/enums'
import { IsRequiredIdNumber, IsOptionalIdNumber, IsOptionalEnumValue } from 'src/shared/decorators/validate'

/**
 * DTO tạo đăng ký khóa học
 * @description Chứa thông tin để đăng ký học sinh vào khóa học
 */
export class CreateCourseEnrollmentDto {
  /**
   * ID khóa học
   * @required
   * @example 5
   */
  @IsRequiredIdNumber('ID khóa học')
  courseId: number

  /**
   * ID học sinh
   * @optional
   * @example 10
   */
  @IsOptionalIdNumber('ID học sinh')
  studentId?: number

  /**
   * Trạng thái đăng ký
   * @optional
   * @example "ACTIVE"
   */
  @IsOptionalEnumValue(CourseEnrollmentStatus, 'Trạng thái')
  status?: CourseEnrollmentStatus
}
