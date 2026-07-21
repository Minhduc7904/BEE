import { BankTransferTransaction } from '../../../domain/entities/tuition-online-payment'
import type { JsonPayload } from '../../../domain/interface/tuition-online-payment'
import {
  BankTransferProcessingStatus,
  BankTransferProvider,
  BankTransferReconciliationStatus,
} from '../../../shared/enums'

export class BankTransferTransactionResponseDto {
  bankTransferTransactionId: number
  provider: BankTransferProvider
  providerTransactionId: string
  sepayV2TransactionId?: string | null
  paymentAttemptId?: number | null
  receivingBankAccountId?: number | null
  amount: number
  transactionAt: Date
  receivingAccountNumber?: string | null
  content?: string | null
  reference?: string | null
  processingStatus: BankTransferProcessingStatus
  reconciliationStatus: BankTransferReconciliationStatus
  createdAt: Date
  updatedAt: Date

  static fromBankTransferTransaction(transaction: BankTransferTransaction): BankTransferTransactionResponseDto {
    return {
      bankTransferTransactionId: transaction.bankTransferTransactionId,
      provider: transaction.provider,
      providerTransactionId: transaction.providerTransactionId,
      sepayV2TransactionId: transaction.sepayV2TransactionId,
      paymentAttemptId: transaction.paymentAttemptId,
      receivingBankAccountId: transaction.receivingBankAccountId,
      amount: transaction.amount,
      transactionAt: transaction.transactionAt,
      receivingAccountNumber: transaction.receivingAccountNumber,
      content: transaction.content,
      reference: transaction.reference,
      processingStatus: transaction.processingStatus,
      reconciliationStatus: transaction.reconciliationStatus,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }
  }

  static fromBankTransferTransactionList(
    transactions: BankTransferTransaction[],
  ): BankTransferTransactionResponseDto[] {
    return transactions.map((transaction) => this.fromBankTransferTransaction(transaction))
  }
}

export class BankTransferTransactionDetailResponseDto extends BankTransferTransactionResponseDto {
  rawPayload?: JsonPayload | null

  static fromBankTransferTransaction(transaction: BankTransferTransaction): BankTransferTransactionDetailResponseDto {
    return {
      ...super.fromBankTransferTransaction(transaction),
      rawPayload: transaction.rawPayload,
    }
  }
}

export class BankTransferTransactionStatisticsResponseDto {
  totalTransactions: number
  unreconciledTransactions: number
  automaticReconciledTransactions: number
  adminReconciledTransactions: number
  totalAmount: number
  currency: 'VND'

  static fromStatistics(input: {
    totalTransactions: number
    unreconciledTransactions: number
    automaticReconciledTransactions: number
    adminReconciledTransactions: number
    totalAmount: number
  }): BankTransferTransactionStatisticsResponseDto {
    return { ...input, currency: 'VND' }
  }
}

export class SyncSepayTransactionsResponseDto {
  backgroundJobRunId: number
  fetchedTransactions: number
  newTransactions: number
  duplicateTransactions: number
  automaticallyMatchedTransactions: number
  lastSinceId: string | null

  static fromResult(input: SyncSepayTransactionsResponseDto): SyncSepayTransactionsResponseDto {
    return { ...input }
  }
}
