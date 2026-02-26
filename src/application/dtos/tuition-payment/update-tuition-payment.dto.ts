import { TuitionPaymentStatus } from 'src/shared/enums'
import { ToNumber } from 'src/shared/decorators'
import { IsOptionalEnumValue, IsOptionalInt, IsOptionalString, IsOptionalDate } from 'src/shared/decorators/validate'

/**
 * DTO cập nhật thanh toán học phí
 * @description Chứa các trường có thể cập nhật của thanh toán học phí
 */
export class UpdateTuitionPaymentDto {
  /**
   * Trạng thái học phí
   * @optional
   * @example "PAID"
   */
  @IsOptionalEnumValue(TuitionPaymentStatus, 'Trạng thái học phí')
  status?: TuitionPaymentStatus

  /**
   * Số tiền học phí
   * @optional
   * @example 500000
   */
  @IsOptionalInt('Số tiền học phí', 0)
  amount?: number | null

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

  /**
   * Ghi chú
   * @optional
   * @example "Đã thanh toán đầy đủ"
   */
  @IsOptionalString('Ghi chú')
  notes?: string

  /**
   * Ngày thanh toán
   * @optional
   * @example "2024-01-15"
   */
  @IsOptionalDate('Ngày thanh toán')
  paidAt?: string
}
