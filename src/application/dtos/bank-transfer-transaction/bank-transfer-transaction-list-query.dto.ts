import { BankTransferTransactionListOptions } from '../../../domain/interface/tuition-online-payment'
import {
  BankTransferProcessingStatus,
  BankTransferProvider,
  BankTransferReconciliationStatus,
} from '../../../shared/enums'
import { SortOrder } from '../../../shared/enums/sort-order.enum'
import {
  IsOptionalDate,
  IsOptionalEnumValue,
  IsOptionalIdNumber,
  IsOptionalInt,
  IsOptionalNumber,
  IsOptionalString,
} from '../../../shared/decorators/validate'
import { ListQueryDto } from '../pagination/list-query.dto'

export class BankTransferTransactionListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(BankTransferProvider, 'Nhà cung cấp')
  provider?: BankTransferProvider

  @IsOptionalIdNumber('ID lần thử thanh toán')
  paymentAttemptId?: number

  @IsOptionalInt('ID ngân hàng nhận tiền', 0)
  receivingBankAccountId?: number

  @IsOptionalEnumValue(BankTransferProcessingStatus, 'Trạng thái xử lý')
  processingStatus?: BankTransferProcessingStatus

  @IsOptionalEnumValue(BankTransferReconciliationStatus, 'Trạng thái đối soát')
  reconciliationStatus?: BankTransferReconciliationStatus

  @IsOptionalString('Mã giao dịch nhà cung cấp', 100)
  providerTransactionId?: string

  @IsOptionalString('Số tài khoản nhận', 50)
  receivingAccountNumber?: string

  @IsOptionalNumber('Số tiền từ', 0)
  minAmount?: number

  @IsOptionalNumber('Số tiền đến', 0)
  maxAmount?: number

  @IsOptionalDate('Thời gian giao dịch từ')
  fromTransactionAt?: string

  @IsOptionalDate('Thời gian giao dịch đến')
  toTransactionAt?: string

  toBankTransferTransactionListOptions(): BankTransferTransactionListOptions {
    const allowedSortFields = [
      'bankTransferTransactionId',
      'providerTransactionId',
      'amount',
      'transactionAt',
      'processingStatus',
      'reconciliationStatus',
      'createdAt',
      'updatedAt',
    ] as const
    const sortBy: NonNullable<BankTransferTransactionListOptions['sortBy']> = allowedSortFields.includes(
      this.sortBy as (typeof allowedSortFields)[number],
    )
      ? (this.sortBy as NonNullable<BankTransferTransactionListOptions['sortBy']>)
      : 'transactionAt'

    return {
      skip: this.offset,
      take: this.limit ?? 10,
      provider: this.provider,
      paymentAttemptId: this.paymentAttemptId,
      receivingBankAccountId: this.receivingBankAccountId === 0 ? null : this.receivingBankAccountId,
      processingStatus: this.processingStatus,
      reconciliationStatus: this.reconciliationStatus,
      providerTransactionId: this.providerTransactionId,
      receivingAccountNumber: this.receivingAccountNumber,
      search: this.search,
      minAmount: this.minAmount,
      maxAmount: this.maxAmount,
      fromTransactionAt: this.fromTransactionAt ? new Date(this.fromTransactionAt) : undefined,
      toTransactionAt: this.toTransactionAt ? new Date(this.toTransactionAt) : undefined,
      sortBy,
      sortOrder: this.sortOrder === SortOrder.ASC ? 'asc' : 'desc',
    }
  }
}
