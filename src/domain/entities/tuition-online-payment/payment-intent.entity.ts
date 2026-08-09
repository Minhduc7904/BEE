import { BankTransferTransactionType, PaymentIntentStatus } from '../../../shared/enums'

export class PaymentIntent {
  paymentIntentId: number
  type: BankTransferTransactionType
  tuitionPaymentId?: number | null
  courseEnrollmentId?: number | null
  amount: number
  currency: string
  status: PaymentIntentStatus
  createdAt: Date
  updatedAt: Date

  // null nghĩa là nghĩa vụ thanh toán không có thời hạn hết hạn.
  expiresAt?: Date | null

  constructor(data: {
    paymentIntentId: number
    type?: BankTransferTransactionType
    tuitionPaymentId?: number | null
    courseEnrollmentId?: number | null
    amount: number
    currency?: string
    status?: PaymentIntentStatus
    expiresAt?: Date | null
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.paymentIntentId = data.paymentIntentId
    this.type = data.type ?? BankTransferTransactionType.TUITION_PAYMENT
    this.tuitionPaymentId = data.tuitionPaymentId ?? null
    this.courseEnrollmentId = data.courseEnrollmentId ?? null
    this.amount = data.amount
    this.currency = data.currency ?? 'VND'
    this.status = data.status ?? PaymentIntentStatus.PENDING
    this.expiresAt = data.expiresAt ?? null
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }

  isPaid(): boolean {
    return this.status === PaymentIntentStatus.PAID
  }

  isExpired(now: Date = new Date()): boolean {
    return this.expiresAt !== null && this.expiresAt !== undefined && this.expiresAt <= now
  }
}
