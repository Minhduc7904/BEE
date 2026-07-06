import { OnlinePaymentAttemptStatus, OnlinePaymentProvider } from '../../../shared/enums'

export class OnlineCoursePaymentAttempt {
  attemptId: number
  attemptCode: string
  invoiceId: number
  provider: OnlinePaymentProvider
  status: OnlinePaymentAttemptStatus
  amount: number
  currency: string
  providerOrderId: string
  createdAt: Date
  updatedAt: Date

  qrContent?: string | null
  providerTransactionId?: string | null
  providerResponseCode?: string | null
  providerMessage?: string | null
  providerBankCode?: string | null
  providerBankTranNo?: string | null
  providerCardType?: string | null
  providerPayDate?: string | null
  checkoutUrl?: string | null
  qrCodeUrl?: string | null
  requestPayload?: any
  responsePayload?: any
  callbackPayload?: any
  paidAt?: Date | null
  failedAt?: Date | null
  canceledAt?: Date | null
  expiredAt?: Date | null
  cancelReason?: string | null

  constructor(data: {
    attemptId: number
    attemptCode: string
    invoiceId: number
    provider: OnlinePaymentProvider
    status?: OnlinePaymentAttemptStatus
    amount: number
    currency?: string
    providerOrderId: string
    qrContent?: string | null
    providerTransactionId?: string | null
    providerResponseCode?: string | null
    providerMessage?: string | null
    providerBankCode?: string | null
    providerBankTranNo?: string | null
    providerCardType?: string | null
    providerPayDate?: string | null
    checkoutUrl?: string | null
    qrCodeUrl?: string | null
    requestPayload?: any
    responsePayload?: any
    callbackPayload?: any
    paidAt?: Date | null
    failedAt?: Date | null
    canceledAt?: Date | null
    expiredAt?: Date | null
    cancelReason?: string | null
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.attemptId = data.attemptId
    this.attemptCode = data.attemptCode
    this.invoiceId = data.invoiceId
    this.provider = data.provider
    this.status = data.status ?? OnlinePaymentAttemptStatus.PENDING
    this.amount = data.amount
    this.currency = data.currency ?? 'VND'
    this.providerOrderId = data.providerOrderId
    this.qrContent = data.qrContent ?? null
    this.providerTransactionId = data.providerTransactionId ?? null
    this.providerResponseCode = data.providerResponseCode ?? null
    this.providerMessage = data.providerMessage ?? null
    this.providerBankCode = data.providerBankCode ?? null
    this.providerBankTranNo = data.providerBankTranNo ?? null
    this.providerCardType = data.providerCardType ?? null
    this.providerPayDate = data.providerPayDate ?? null
    this.checkoutUrl = data.checkoutUrl ?? null
    this.qrCodeUrl = data.qrCodeUrl ?? null
    this.requestPayload = data.requestPayload
    this.responsePayload = data.responsePayload
    this.callbackPayload = data.callbackPayload
    this.paidAt = data.paidAt ?? null
    this.failedAt = data.failedAt ?? null
    this.canceledAt = data.canceledAt ?? null
    this.expiredAt = data.expiredAt ?? null
    this.cancelReason = data.cancelReason ?? null
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }

  isSucceeded(): boolean {
    return this.status === OnlinePaymentAttemptStatus.SUCCEEDED
  }

  isTerminal(): boolean {
    return [
      OnlinePaymentAttemptStatus.SUCCEEDED,
      OnlinePaymentAttemptStatus.FAILED,
      OnlinePaymentAttemptStatus.CANCELLED,
      OnlinePaymentAttemptStatus.EXPIRED,
    ].includes(this.status)
  }

  toJSON() {
    return { ...this }
  }
}
