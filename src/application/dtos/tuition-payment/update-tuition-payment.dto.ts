import { ToNumber } from 'src/shared/decorators'
import { IsOptionalInt } from 'src/shared/decorators/validate'

/**
 * DTO cập nhật thanh toán học phí
 * @description Chứa các trường có thể cập nhật của thanh toán học phí
 */
export class UpdateTuitionPaymentDto {
  /**
   * Số tiền học phí
   * @optional
   * @example 500000
   */
  @IsOptionalInt('Số tiền học phí', 0)
  amount?: number

  /**
   * Tháng (1-12)
   * @optional
   * @example 1
   */
  @ToNumber()
  @IsOptionalInt('Tháng', 1, 12)
  month?: number

  /**
   * Năm (từ 2000)
   * @optional
   * @example 2024
   */
  @ToNumber()
  @IsOptionalInt('Năm', 2000)
  year?: number

}
