import { TuitionPayment } from '../../entities'
import { TuitionPaymentStatus } from 'src/shared/enums'

/**
 * ===== CREATE =====
 */
export interface CreateTuitionPaymentData {
  studentId: number
  courseId?: number
  month?: number
  year?: number

  amount?: number | null // 💰 tiền phải đóng (snapshot), null/undefined = chưa xác định, 0 = miễn phí

  status?: TuitionPaymentStatus
  paidAt?: Date
  notes?: string
}

/**
 * ===== UPDATE =====
 */
export interface UpdateTuitionPaymentData {
  /**
   * Chỉ cho phép đưa về UNPAID. Chuyển UNPAID -> PAID bắt buộc đi qua
   * `ITuitionPaymentRepository.markPaid` để cờ phụ huynh báo chuyển khoản luôn được dọn cùng lúc.
   */
  status?: TuitionPaymentStatus.UNPAID
  paidAt?: Date | null
  notes?: string
  courseId?: number | null
  month?: number | null
  year?: number | null
  amount?: number | null
  payerReportedTransferredAt?: Date | null
  payerReportedTransferredByUserId?: number | null
}

/** Dữ liệu xóa cờ phụ huynh báo chuyển khoản (dùng khi số tiền phải đóng thay đổi). */
export const CLEAR_PAYER_REPORTED_TRANSFER: Pick<
  UpdateTuitionPaymentData,
  'payerReportedTransferredAt' | 'payerReportedTransferredByUserId'
> = {
  payerReportedTransferredAt: null,
  payerReportedTransferredByUserId: null,
}

/** Dữ liệu chuyển khoản học phí UNPAID -> PAID. */
export interface MarkTuitionPaymentPaidData {
  paidAt: Date
  /** Ghi chú mới (thay thế ghi chú hiện tại); bỏ trống để giữ nguyên. */
  notes?: string
}

/**
 * ===== FILTER =====
 */
export interface TuitionPaymentFilterOptions {
  studentId?: number
  courseId?: number
  status?: TuitionPaymentStatus
  year?: number
  month?: number
  fromPaidAt?: Date
  toPaidAt?: Date
  studentIds?: number[]
  search?: string
  grade?: number
  minAmount?: number
  maxAmount?: number
  /** true = phụ huynh đã báo chuyển khoản, false = chưa báo; bỏ trống = tất cả. */
  payerReportedTransferred?: boolean
}

/**
 * ===== PAGINATION =====
 */
export interface TuitionPaymentPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * ===== LIST RESULT =====
 */
export interface TuitionPaymentListResult {
  data: TuitionPayment[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * ===== STATS =====
 */
export interface TuitionPaymentStatusStats {
  status: TuitionPaymentStatus
  total: number
}

export interface TuitionPaymentMonthlyStats {
  month: number
  year: number
  total: number
  paid: number
  unpaid: number
}

export interface TuitionPaymentCourseStats {
  courseId: number
  total: number
  paid: number
  unpaid: number
}

export interface TuitionPaymentMoneyStats {
  collected: number   // đã thu
  uncollected: number // chưa thu
  expected: number    // dự kiến (tổng)
}

export interface MonthlyPaymentStats {
  month: number
  paidAmount: number
  unpaidAmount: number
  totalAmount: number
  paidCount: number
  unpaidCount: number
  totalCount: number
}