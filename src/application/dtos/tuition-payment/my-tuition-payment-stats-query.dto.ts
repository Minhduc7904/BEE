import { IsInt, IsOptional, Min, Max } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'
import { TuitionPaymentFilterOptions } from 'src/domain/interface/tuition-payment/tuition-payment.interface'

export class MyTuitionPaymentStatsQueryDto {
  /**
   * Lọc theo năm
   */
  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'Năm phải là số nguyên' })
  @Min(2000, { message: 'Năm không hợp lệ' })
  year?: number

  /**
   * Lọc theo tháng
   */
  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'Tháng phải là số nguyên' })
  @Min(1, { message: 'Tháng phải từ 1 đến 12' })
  @Max(12, { message: 'Tháng phải từ 1 đến 12' })
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
