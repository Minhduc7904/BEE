import { IsOptionalIdNumber, IsOptionalInt } from 'src/shared/decorators/validate'
import { TuitionPaymentFilterOptions } from 'src/domain/interface/tuition-payment/tuition-payment.interface'

/**
 * DTO for querying tuition payment statistics (ADMIN)
 * 
 * @description Filter options for tuition payment statistics dashboard
 */
export class TuitionPaymentStatsQueryDto {
  /**
   * Filter by course ID (ADMIN)
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('ID khoá học')
  courseId?: number

  /**
   * Filter by student ID (ADMIN)
   * @optional
   * @example 10
   */
  @IsOptionalIdNumber('ID học sinh')
  studentId?: number

  /**
   * Filter by year (min: 2000)
   * @optional
   * @example 2024
   */
  @IsOptionalInt('Năm', 2000)
  year?: number

  /**
   * Filter by month (1-12)
   * @optional
   * @example 6
   */
  @IsOptionalInt('Tháng', 1, 12)
  month?: number

  /**
   * Map sang domain filter
   */
  toFilterOptions(): TuitionPaymentFilterOptions {
    return {
      courseId: this.courseId,
      studentId: this.studentId,
      year: this.year,
      month: this.month,
    }
  }
}
