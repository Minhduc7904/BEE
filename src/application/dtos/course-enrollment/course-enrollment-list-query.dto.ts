import { Type } from 'class-transformer'
import { ListQueryDto } from '../pagination/list-query.dto'
import {
  CourseEnrollmentFilterOptions,
  CourseEnrollmentPaginationOptions,
} from 'src/domain/interface/course-enrollment/course-enrollment.interface'
import { CourseEnrollmentStatus, Visibility } from 'src/shared/enums'
import { ToNumber } from 'src/shared/decorators'
import { IsOptionalIdNumber, IsOptionalString, IsOptionalDate } from 'src/shared/decorators/validate'

/**
 * DTO truy vấn danh sách đăng ký khóa học
 * @description Chứa các tham số lọc và phân trang cho danh sách đăng ký
 */
export class CourseEnrollmentListQueryDto extends ListQueryDto {
  /**
   * ID khóa học
   * @optional
   * @example 5
   */
  @ToNumber()
  @IsOptionalIdNumber('ID khóa học')
  courseId?: number

  /**
   * ID học sinh
   * @optional
   * @example 10
   */
  @ToNumber()
  @IsOptionalIdNumber('ID học sinh')
  studentId?: number

  /**
   * Trạng thái đăng ký
   * @optional
   * @example "ACTIVE"
   */
  @IsOptionalString('Trạng thái')
  status?: CourseEnrollmentStatus

  /**
   * Ngày đăng ký từ
   * @optional
   * @example "2024-01-01"
   */
  @IsOptionalDate('Ngày đăng ký từ')
  enrolledAtFrom?: string

  /**
   * Ngày đăng ký đến
   * @optional
   * @example "2024-12-31"
   */
  @IsOptionalDate('Ngày đăng ký đến')
  enrolledAtTo?: string

  /**
   * Trạng thái hiển thị khóa học
   * @optional
   * @example "PUBLIC"
   */
  @IsOptionalString('Trạng thái hiển thị khóa học')
  courseVisibility?: Visibility

  toCourseEnrollmentFilterOptions(): CourseEnrollmentFilterOptions {
    return {
      courseId: this.courseId,
      studentId: this.studentId,
      status: this.status,
      search: this.search,
      enrolledAtFrom: this.enrolledAtFrom ? new Date(this.enrolledAtFrom) : undefined,
      enrolledAtTo: this.enrolledAtTo ? new Date(this.enrolledAtTo) : undefined,
      courseVisibility: this.courseVisibility,
    };
  }

  toCourseEnrollmentPaginationOptions(): CourseEnrollmentPaginationOptions {
    const allowedSortFields = [
      'enrollmentId',
      'courseId',
      'studentId',
      'enrolledAt',
      'status',
    ];

    const sortBy = allowedSortFields.includes(this.sortBy || '')
      ? this.sortBy
      : 'enrolledAt';

    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy,
      sortOrder: this.sortOrder,
    };
  }
}
