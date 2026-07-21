import {
  BankTransferProcessingStatus,
  BankTransferProvider,
  BankTransferReconciliationStatus,
} from '../../../shared/enums'
import type { JsonPayload } from '../../interface/tuition-online-payment'
import type { ReceivingBankAccount } from './receiving-bank-account.entity'

export class BankTransferTransaction {
  bankTransferTransactionId: number
  provider: BankTransferProvider
  providerTransactionId: string
  sepayV2TransactionId?: string | null
  amount: number
  transactionAt: Date
  processingStatus: BankTransferProcessingStatus
  reconciliationStatus: BankTransferReconciliationStatus
  createdAt: Date
  updatedAt: Date

  paymentAttemptId?: number | null
  receivingBankAccountId?: number | null
  receivingBankAccount?: ReceivingBankAccount | null
  receivingAccountNumber?: string | null
  content?: string | null
  reference?: string | null
  rawPayload?: JsonPayload | null

  constructor(data: {
    bankTransferTransactionId: number
    provider: BankTransferProvider
    providerTransactionId: string
    sepayV2TransactionId?: string | null
    amount: number
    transactionAt: Date
    processingStatus?: BankTransferProcessingStatus
    reconciliationStatus?: BankTransferReconciliationStatus
    paymentAttemptId?: number | null
    receivingBankAccountId?: number | null
    receivingBankAccount?: ReceivingBankAccount | null
    receivingAccountNumber?: string | null
    content?: string | null
    reference?: string | null
    rawPayload?: JsonPayload | null
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.bankTransferTransactionId = data.bankTransferTransactionId
    this.provider = data.provider
    this.providerTransactionId = data.providerTransactionId
    this.sepayV2TransactionId = data.sepayV2TransactionId ?? null
    this.amount = data.amount
    this.transactionAt = data.transactionAt
    this.processingStatus = data.processingStatus ?? BankTransferProcessingStatus.RECEIVED
    this.reconciliationStatus = data.reconciliationStatus ?? BankTransferReconciliationStatus.UNRECONCILED
    this.paymentAttemptId = data.paymentAttemptId ?? null
    this.receivingBankAccountId = data.receivingBankAccountId ?? null
    this.receivingBankAccount = data.receivingBankAccount
    this.receivingAccountNumber = data.receivingAccountNumber ?? null
    this.content = data.content ?? null
    this.reference = data.reference ?? null
    this.rawPayload = data.rawPayload ?? null
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }
}
