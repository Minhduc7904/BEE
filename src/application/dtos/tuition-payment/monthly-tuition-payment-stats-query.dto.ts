import { IsRequiredInt, IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO for querying monthly tuition payment statistics
 * 
 * @description Get tuition payment statistics grouped by month for a specific year
 */
export class MonthlyTuitionPaymentStatsQueryDto {
  /**
   * Year (2000-2100)
   * @required
   * @example 2024
   */
  @IsRequiredInt('Năm', 2000, 2100)
  year: number

  /**
   * Filter by course ID
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('ID khoá học')
  courseId?: number

  /**
   * Filter by student ID
   * @optional
   * @example 10
   */
  @IsOptionalIdNumber('ID học sinh')
  studentId?: number
}
