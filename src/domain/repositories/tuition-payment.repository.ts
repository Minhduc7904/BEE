import { TuitionPayment } from '../entities'
import {
  CreateTuitionPaymentData,
  UpdateTuitionPaymentData,
  TuitionPaymentFilterOptions,
  TuitionPaymentPaginationOptions,
  TuitionPaymentListResult,
  TuitionPaymentStatusStats,
  TuitionPaymentMonthlyStats,
  TuitionPaymentCourseStats,
  TuitionPaymentMoneyStats
} from '../interface/tuition-payment/tuition-payment.interface'
import { TuitionPaymentStatus } from 'src/shared/enums'

export interface ITuitionPaymentRepository {
  // ===== CRUD =====
  create(data: CreateTuitionPaymentData): Promise<TuitionPayment>
  findById(id: number): Promise<TuitionPayment | null>
  update(id: number, data: UpdateTuitionPaymentData): Promise<TuitionPayment>
  delete(id: number): Promise<boolean>

  

  // ===== BASIC QUERY =====
  findAll(): Promise<TuitionPayment[]>

  // ===== PAGINATION + FILTER =====
  findAllWithPagination(
    pagination: TuitionPaymentPaginationOptions,
    filters?: TuitionPaymentFilterOptions,
  ): Promise<TuitionPaymentListResult>

  findWithFilter(
    filters: TuitionPaymentFilterOptions,
  ): Promise<TuitionPayment[]>

  exists(
    filters: TuitionPaymentFilterOptions,
  ): Promise<boolean>

  // ===== FIND SPECIFIC =====
  findByStudent(studentId: number): Promise<TuitionPayment[]>
  findByCourse(courseId: number): Promise<TuitionPayment[]>
  findByStudentAndPeriod(studentId: number, month: number, year: number): Promise<TuitionPayment | null>

  // ===== STATUS =====
  findByStatus(status: TuitionPaymentStatus): Promise<TuitionPayment[]>

  // ===== COUNT =====
  count(filters?: TuitionPaymentFilterOptions): Promise<number>
  countByStudent(studentId: number): Promise<number>
  countByCourse(courseId: number): Promise<number>

  // ==============================
  // 📊 STATISTICS (QUAN TRỌNG)
  // ==============================

  /** Thống kê số lượng theo status */
  statsByStatus(filters?: TuitionPaymentFilterOptions): Promise<TuitionPaymentStatusStats[]>

  /** Thống kê theo tháng (1 năm) */
  statsByMonth(year: number, courseId?: number): Promise<TuitionPaymentMonthlyStats[]>

  /** Thống kê theo course */
  statsByCourse(year?: number, month?: number): Promise<TuitionPaymentCourseStats[]>

  /** Tổng UNPAID (dùng cho cảnh báo / badge đỏ 🔴) */
  countUnpaid(filters?: TuitionPaymentFilterOptions): Promise<number>
  statsMoney(filters?: TuitionPaymentFilterOptions): Promise<TuitionPaymentMoneyStats>
}
