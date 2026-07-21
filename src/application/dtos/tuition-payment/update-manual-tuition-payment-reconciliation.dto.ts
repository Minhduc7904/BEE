import { IsRequiredIntArray } from 'src/shared/decorators/validate'

export class UpdateManualTuitionPaymentReconciliationDto {
  @IsRequiredIntArray('Danh sách ID giao dịch ngân hàng')
  bankTransferTransactionIds: number[]
}
