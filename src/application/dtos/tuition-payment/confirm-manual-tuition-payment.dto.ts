import { IsOptionalDate, IsOptionalIntArray, IsOptionalString } from 'src/shared/decorators/validate'

/**
 * Xác nhận học phí đã thu sau khi admin đối soát chuyển khoản.
 */
export class ConfirmManualTuitionPaymentDto {
  @IsOptionalIntArray('Danh sách ID giao dịch ngân hàng')
  bankTransferTransactionIds?: number[]

  @IsOptionalString('Mã tham chiếu giao dịch', 100, 1)
  reference?: string

  @IsOptionalString('Lý do xác nhận', 500, 3)
  reason?: string

  @IsOptionalDate('Thời gian thanh toán')
  paidAt?: string
}
