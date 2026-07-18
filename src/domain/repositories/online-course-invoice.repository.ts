import { OnlineCourseInvoice } from '../entities/online-course-payment'
import { OnlineCourseInvoiceStatus, OnlinePaymentProvider } from '../../shared/enums'

export interface CreateOnlineCourseInvoiceData {
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
}

export interface UpdateOnlineCourseInvoiceData {
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
}

export interface OnlineCourseInvoiceListOptions {
  skip: number
  take: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  status?: OnlineCourseInvoiceStatus
  paymentProvider?: OnlinePaymentProvider
  studentId?: number
  buyerUserId?: number
  invoiceCode?: string
  fromDate?: Date
  toDate?: Date
}

export interface OnlineCourseInvoiceListResult {
  data: OnlineCourseInvoice[]
  total: number
}

export interface IOnlineCourseInvoiceRepository {
  create(data: CreateOnlineCourseInvoiceData): Promise<OnlineCourseInvoice>
  findById(invoiceId: number): Promise<OnlineCourseInvoice | null>
  findByCode(invoiceCode: string): Promise<OnlineCourseInvoice | null>
  findPendingByStudentAndCourse(studentId: number, courseId: number): Promise<OnlineCourseInvoice | null>
  findLatestByStudentAndCourse(studentId: number, courseId: number): Promise<OnlineCourseInvoice | null>
  findAllWithPagination(options: OnlineCourseInvoiceListOptions): Promise<OnlineCourseInvoiceListResult>
  update(invoiceId: number, data: UpdateOnlineCourseInvoiceData): Promise<OnlineCourseInvoice>
  delete(invoiceId: number): Promise<void>
  markPaid(invoiceId: number, paidAmount: number, paidAt?: Date): Promise<OnlineCourseInvoice>
  markPaymentFailed(invoiceId: number, reason?: string): Promise<OnlineCourseInvoice>
}
