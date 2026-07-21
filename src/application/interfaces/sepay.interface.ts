import { SepayTransactionTransferType } from '../../shared/enums'

export abstract class SepayService {}

export interface SepayWebhookHeaders {
  signature?: string
  timestamp?: string
}

export interface SepayQrInput {
  bankCode: string
  accountNumber: string
  amount: number
  description: string
}

export interface SepayBankAccount {
  sepayBankAccountId: string
  bankCode: string
  accountNumber: string
  accountHolder: string
  balance: string
  isActive: boolean
  lastTransactionAt?: string | null
}

export interface SepayV2Transaction {
  sepayV2TransactionId: string
  transactionDate: string
  accountNumber: string
  transferType: SepayTransactionTransferType
  amountIn: number
  amountOut: number
  transactionContent?: string | null
  referenceNumber?: string | null
  code?: string | null
  bankAccountId?: string | null
  rawPayload: Record<string, unknown>
}

export interface ListSepayV2TransactionsInput {
  sinceId?: string | null
  page?: number
  perPage: number
  transferType?: SepayTransactionTransferType
}

export interface SepayV2TransactionsPage {
  transactions: SepayV2Transaction[]
  hasMore: boolean
}

export interface SepayService {
  verifyWebhook(rawBody: Buffer, headers: SepayWebhookHeaders): void
  createVietQrUrl(input: SepayQrInput): string
  getAttemptExpiry(): Date
  listBankAccounts(): Promise<SepayBankAccount[]>
  getBankAccount(sepayBankAccountId: string): Promise<SepayBankAccount>
  listV2Transactions(input: ListSepayV2TransactionsInput): Promise<SepayV2TransactionsPage>
}
