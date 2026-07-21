import { BankTransferTransactionListOptions } from '../../../domain/interface/tuition-online-payment'
import {
  BankTransferProcessingStatus,
  BankTransferProvider,
  BankTransferReconciliationStatus,
} from '../../../shared/enums'
import {
  IsOptionalDate,
  IsOptionalEnumValue,
  IsOptionalIdNumber,
  IsOptionalNumber,
  IsOptionalString,
} from '../../../shared/decorators/validate'

export class BankTransferTransactionStatisticsQueryDto {
  @IsOptionalEnumValue(BankTransferProvider, 'Nhà cung cấp')
  provider?: BankTransferProvider

  @IsOptionalIdNumber('ID lần thử thanh toán')
  paymentAttemptId?: number

  @IsOptionalEnumValue(BankTransferProcessingStatus, 'Trạng thái xử lý')
  processingStatus?: BankTransferProcessingStatus

  @IsOptionalEnumValue(BankTransferReconciliationStatus, 'Trạng thái đối soát')
  reconciliationStatus?: BankTransferReconciliationStatus

  @IsOptionalString('Mã giao dịch nhà cung cấp', 100)
  providerTransactionId?: string

  @IsOptionalString('Số tài khoản nhận', 50)
  receivingAccountNumber?: string

  @IsOptionalString('Từ khóa tìm kiếm', 255)
  search?: string

  @IsOptionalNumber('Số tiền từ', 0)
  minAmount?: number

  @IsOptionalNumber('Số tiền đến', 0)
  maxAmount?: number

  @IsOptionalDate('Thời gian giao dịch từ')
  fromTransactionAt?: string

  @IsOptionalDate('Thời gian giao dịch đến')
  toTransactionAt?: string

  toBankTransferTransactionListOptions(): BankTransferTransactionListOptions {
    return {
      provider: this.provider,
      paymentAttemptId: this.paymentAttemptId,
      processingStatus: this.processingStatus,
      reconciliationStatus: this.reconciliationStatus,
      providerTransactionId: this.providerTransactionId,
      receivingAccountNumber: this.receivingAccountNumber,
      search: this.search,
      minAmount: this.minAmount,
      maxAmount: this.maxAmount,
      fromTransactionAt: this.fromTransactionAt ? new Date(this.fromTransactionAt) : undefined,
      toTransactionAt: this.toTransactionAt ? new Date(this.toTransactionAt) : undefined,
    }
  }
}
