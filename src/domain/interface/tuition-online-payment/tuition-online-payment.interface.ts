import {
  BankTransferProcessingStatus,
  BankTransferProvider,
  BankTransferReconciliationStatus,
  PaymentAttemptStatus,
  PaymentBankSelectionSource,
  PaymentConfirmationMode,
  PaymentIntentStatus,
  ReceivingBankAccountStatus,
  SepayBankAccountStatus,
  TuitionCollectionMode,
} from '../../../shared/enums'

export type JsonPayload = string | number | boolean | JsonPayload[] | { [key: string]: JsonPayload | null }

export interface OffsetPaginationOptions {
  skip?: number
  take?: number
}

export interface CreateReceivingBankAccountData {
  bankCode: string
  accountNumber: string
  accountHolder: string
  displayName?: string | null
  status?: ReceivingBankAccountStatus
  sepayBankAccountId?: string | null
  sepayStatus?: SepayBankAccountStatus
  notes?: string | null
}

export interface UpdateReceivingBankAccountData {
  bankCode?: string
  accountNumber?: string
  accountHolder?: string
  displayName?: string | null
  status?: ReceivingBankAccountStatus
  sepayBankAccountId?: string | null
  sepayStatus?: SepayBankAccountStatus
  notes?: string | null
}

export interface ReceivingBankAccountListOptions extends OffsetPaginationOptions {
  status?: ReceivingBankAccountStatus
  bankCode?: string
  search?: string
  sortBy?:
    | 'receivingBankAccountId'
    | 'bankCode'
    | 'accountHolder'
    | 'displayName'
    | 'status'
    | 'createdAt'
    | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface CreateTuitionGradeReceivingBankAccountData {
  grade: number
  receivingBankAccountId?: number | null
}

export interface UpdateTuitionGradeReceivingBankAccountData {
  receivingBankAccountId: number | null
}

export interface TuitionGradeReceivingBankAccountListOptions extends OffsetPaginationOptions {
  receivingBankAccountId?: number
}

export interface CreateTuitionCollectionConfigurationData {
  collectionMode?: TuitionCollectionMode
  defaultManualReceivingBankAccountId: number
}

export interface UpdateTuitionCollectionConfigurationData {
  collectionMode?: TuitionCollectionMode
  defaultManualReceivingBankAccountId?: number
}

export interface CreatePaymentIntentData {
  tuitionPaymentId: number
  amount: number
  currency?: string
  status?: PaymentIntentStatus
  expiresAt?: Date | null
}

export interface UpdatePaymentIntentData {
  amount?: number
  status?: PaymentIntentStatus
  expiresAt?: Date | null
}

export interface PaymentIntentListOptions extends OffsetPaginationOptions {
  status?: PaymentIntentStatus
  tuitionPaymentId?: number
  expiresBefore?: Date
}

export interface CreatePaymentAttemptData {
  paymentIntentId: number
  attemptCode: string
  receivingBankAccountId: number
  amount: number
  currency?: string
  bankSelectionSource: PaymentBankSelectionSource
  confirmationMode: PaymentConfirmationMode
  status?: PaymentAttemptStatus
  qrCodeUrl?: string | null
  expiresAt: Date
}

export interface UpdatePaymentAttemptData {
  status?: PaymentAttemptStatus
  qrCodeUrl?: string | null
  expiresAt?: Date
}

export interface PaymentAttemptListOptions extends OffsetPaginationOptions {
  paymentIntentId?: number
  receivingBankAccountId?: number
  status?: PaymentAttemptStatus
  confirmationMode?: PaymentConfirmationMode
  expiresBefore?: Date
}

export interface CreateBankTransferTransactionData {
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
  rawPayload?: JsonPayload
  processingStatus?: BankTransferProcessingStatus
  reconciliationStatus?: BankTransferReconciliationStatus
}

export interface UpdateBankTransferTransactionReconciliationData {
  paymentAttemptId?: number | null
  processingStatus?: BankTransferProcessingStatus
  reconciliationStatus?: BankTransferReconciliationStatus
}

export interface BankTransferTransactionProviderReferenceMatchOptions {
  provider: BankTransferProvider
  reference: string
  amount: number
  receivingAccountNumber: string
}

export interface BankTransferTransactionListOptions extends OffsetPaginationOptions {
  provider?: BankTransferProvider
  paymentAttemptId?: number
  paymentAttemptIds?: number[]
  paymentAttemptIdsOrUnassigned?: number[]
  receivingBankAccountId?: number | null
  includeReceivingBankAccount?: boolean
  processingStatus?: BankTransferProcessingStatus
  reconciliationStatus?: BankTransferReconciliationStatus
  providerTransactionId?: string
  receivingAccountNumber?: string
  search?: string
  minAmount?: number
  maxAmount?: number
  fromTransactionAt?: Date
  toTransactionAt?: Date
  sortBy?:
    | 'bankTransferTransactionId'
    | 'providerTransactionId'
    | 'amount'
    | 'transactionAt'
    | 'processingStatus'
    | 'reconciliationStatus'
    | 'createdAt'
    | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface BankTransferTransactionStatistics {
  totalTransactions: number
  unreconciledTransactions: number
  automaticReconciledTransactions: number
  adminReconciledTransactions: number
  totalAmount: number
}
