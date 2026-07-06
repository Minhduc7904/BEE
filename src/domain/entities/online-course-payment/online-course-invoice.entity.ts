import { OnlineCourseInvoiceStatus, OnlinePaymentProvider } from '../../../shared/enums'
import { OnlineCourseInvoiceItem } from './online-course-invoice-item.entity'
import { OnlineCoursePaymentAttempt } from './online-course-payment-attempt.entity'

export class OnlineCourseInvoice {
  invoiceId: number
  invoiceCode: string
  buyerUserId: number
  studentId: number
  status: OnlineCourseInvoiceStatus
  currency: string
  subtotalAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  refundedAmount: number
  createdAt: Date
  updatedAt: Date

  paymentProvider?: OnlinePaymentProvider | null
  providerOrderId?: string | null
  checkoutUrl?: string | null
  qrCodeUrl?: string | null
  expiresAt?: Date | null
  paidAt?: Date | null
  canceledAt?: Date | null
  refundedAt?: Date | null
  cancelReason?: string | null
  notes?: string | null
  metadata?: any

  items?: OnlineCourseInvoiceItem[]
  paymentAttempts?: OnlineCoursePaymentAttempt[]

  constructor(data: {
    invoiceId: number
    invoiceCode: string
    buyerUserId: number
    studentId: number
    status?: OnlineCourseInvoiceStatus
    currency?: string
    subtotalAmount?: number
    discountAmount?: number
    totalAmount?: number
    paidAmount?: number
    refundedAmount?: number
    paymentProvider?: OnlinePaymentProvider | null
    providerOrderId?: string | null
    checkoutUrl?: string | null
    qrCodeUrl?: string | null
    expiresAt?: Date | null
    paidAt?: Date | null
    canceledAt?: Date | null
    refundedAt?: Date | null
    cancelReason?: string | null
    notes?: string | null
    metadata?: any
    createdAt?: Date
    updatedAt?: Date
    items?: OnlineCourseInvoiceItem[]
    paymentAttempts?: OnlineCoursePaymentAttempt[]
  }) {
    this.invoiceId = data.invoiceId
    this.invoiceCode = data.invoiceCode
    this.buyerUserId = data.buyerUserId
    this.studentId = data.studentId
    this.status = data.status ?? OnlineCourseInvoiceStatus.PENDING_PAYMENT
    this.currency = data.currency ?? 'VND'
    this.subtotalAmount = data.subtotalAmount ?? 0
    this.discountAmount = data.discountAmount ?? 0
    this.totalAmount = data.totalAmount ?? 0
    this.paidAmount = data.paidAmount ?? 0
    this.refundedAmount = data.refundedAmount ?? 0
    this.paymentProvider = data.paymentProvider ?? null
    this.providerOrderId = data.providerOrderId ?? null
    this.checkoutUrl = data.checkoutUrl ?? null
    this.qrCodeUrl = data.qrCodeUrl ?? null
    this.expiresAt = data.expiresAt ?? null
    this.paidAt = data.paidAt ?? null
    this.canceledAt = data.canceledAt ?? null
    this.refundedAt = data.refundedAt ?? null
    this.cancelReason = data.cancelReason ?? null
    this.notes = data.notes ?? null
    this.metadata = data.metadata
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
    this.items = data.items
    this.paymentAttempts = data.paymentAttempts
  }

  isPendingPayment(): boolean {
    return this.status === OnlineCourseInvoiceStatus.PENDING_PAYMENT
  }

  isPaid(): boolean {
    return this.status === OnlineCourseInvoiceStatus.PAID
  }

  canBeMarkedPaid(): boolean {
    return this.isPendingPayment() || this.status === OnlineCourseInvoiceStatus.PAYMENT_FAILED
  }

  toJSON() {
    return { ...this }
  }
}
