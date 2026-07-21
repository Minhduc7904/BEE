import {
  PaymentAttemptStatus,
  PaymentBankSelectionSource,
  PaymentConfirmationMode,
} from '../../../shared/enums'

export class PaymentAttempt {
  paymentAttemptId: number
  paymentIntentId: number
  attemptCode: string
  receivingBankAccountId: number
  amount: number
  currency: string
  bankSelectionSource: PaymentBankSelectionSource
  confirmationMode: PaymentConfirmationMode
  status: PaymentAttemptStatus
  createdAt: Date
  updatedAt: Date

  qrCodeUrl?: string | null
  expiresAt: Date

  constructor(data: {
    paymentAttemptId: number
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
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.paymentAttemptId = data.paymentAttemptId
    this.paymentIntentId = data.paymentIntentId
    this.attemptCode = data.attemptCode
    this.receivingBankAccountId = data.receivingBankAccountId
    this.amount = data.amount
    this.currency = data.currency ?? 'VND'
    this.bankSelectionSource = data.bankSelectionSource
    this.confirmationMode = data.confirmationMode
    this.status = data.status ?? PaymentAttemptStatus.PENDING
    this.qrCodeUrl = data.qrCodeUrl ?? null
    this.expiresAt = data.expiresAt
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }

  isPending(): boolean {
    return this.status === PaymentAttemptStatus.PENDING
  }

  requiresManualResolution(): boolean {
    return this.confirmationMode === PaymentConfirmationMode.MANUAL_FALLBACK
  }

  isExpired(now: Date = new Date()): boolean {
    return this.expiresAt <= now
  }
}
