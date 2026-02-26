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
  status?: TuitionPaymentStatus
  paidAt?: Date | null
  notes?: string
  courseId?: number | null
  month?: number | null
  year?: number | null
  amount?: number | null
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