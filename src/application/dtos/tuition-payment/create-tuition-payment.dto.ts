import { TuitionPaymentStatus } from 'src/shared/enums'
import { ToNumber } from 'src/shared/decorators'
import { IsRequiredIdNumber, IsOptionalIdNumber, IsRequiredInt, IsOptionalInt, IsRequiredEnumValue, IsOptionalString } from 'src/shared/decorators/validate'

/**
 * DTO tạo thanh toán học phí
 * @description Chứa thông tin để tạo bản ghi thanh toán học phí
 */
export class CreateTuitionPaymentDto {
  /**
   * ID học sinh
   * @required
   * @example 10
   */
  @ToNumber()
  @IsRequiredIdNumber('ID học sinh')
  studentId: number

  /**
   * ID khóa học
   * @optional
   * @example 5
   */
  @ToNumber()
  @IsOptionalIdNumber('ID khoá học')
  courseId?: number

  /**
   * Số tiền học phí (snapshot)
   * @required
   * @example 500000
   */
  @ToNumber()
  @IsRequiredInt('Số tiền học phí', 1)
  amount: number

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
   * Trạng thái học phí
   * @required
   * @example "PAID"
   */
  @IsRequiredEnumValue(TuitionPaymentStatus, 'Trạng thái học phí')
  status: TuitionPaymentStatus

  /**
   * Ghi chú
   * @optional
   * @example "Đã thanh toán đầy đủ"
   */
  @IsOptionalString('Ghi chú')
  notes?: string
}
