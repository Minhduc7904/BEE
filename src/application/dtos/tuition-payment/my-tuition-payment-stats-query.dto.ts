import { IsOptionalInt } from 'src/shared/decorators/validate'
import { TuitionPaymentFilterOptions } from 'src/domain/interface/tuition-payment/tuition-payment.interface'

/**
 * DTO for querying my tuition payment statistics
 * 
 * @description Filter options for student's own tuition payment statistics
 */
export class MyTuitionPaymentStatsQueryDto {
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
   * ⚠️ studentId sẽ được ép từ token ở UseCase
   */
  toFilterOptions(): TuitionPaymentFilterOptions {
    return {
      year: this.year,
      month: this.month,
    }
  }
}
