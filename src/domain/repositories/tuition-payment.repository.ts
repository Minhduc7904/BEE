import { TuitionPayment } from '../entities'
import {
  CreateTuitionPaymentData,
  UpdateTuitionPaymentData,
  MarkTuitionPaymentPaidData,
  TuitionPaymentFilterOptions,
  TuitionPaymentPaginationOptions,
  TuitionPaymentListResult,
  TuitionPaymentStatusStats,
  TuitionPaymentMonthlyStats,
  TuitionPaymentCourseStats,
  TuitionPaymentMoneyStats
} from '../interface/tuition-payment/tuition-payment.interface'
import { TuitionPaymentStatus } from 'src/shared/enums'
import { MonthlyPaymentStats } from '../interface/tuition-payment/tuition-payment.interface'
export interface ITuitionPaymentRepository {
  // ===== CRUD =====
  create(data: CreateTuitionPaymentData): Promise<TuitionPayment>
  findById(id: number): Promise<TuitionPayment | null>
  update(id: number, data: UpdateTuitionPaymentData): Promise<TuitionPayment | null>
  delete(id: number): Promise<boolean>

  /**
   * Đường chuyển trạng thái duy nhất UNPAID -> PAID: ghi PAID/paidAt và xóa cờ phụ huynh báo chuyển khoản
   * trong cùng một câu lệnh UPDATE. Mọi luồng SePay, xác nhận thủ công và cập nhật hàng loạt phải dùng method này.
   */
  markPaid(id: number, data: MarkTuitionPaymentPaidData): Promise<TuitionPayment | null>

  /**
   * Ghi cờ phụ huynh báo đã chuyển khoản bằng conditional update nguyên tử
   * (paymentId + status=UNPAID + chưa báo + amount > 0). Trả true nếu lần gọi này ghi được cờ.
   */
  reportPayerTransferred(id: number, userId: number, reportedAt: Date): Promise<boolean>

  

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
  findByMonthYear(month: number, year: number, studentIds: number[]): Promise<TuitionPayment[]>

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
  
  /** Thống kê số tiền đã đóng, chưa thu được theo từng tháng của 1 năm */
  statsByMonthlyAmount(year: number, courseId?: number, studentId?: number): Promise<MonthlyPaymentStats[]>
}
