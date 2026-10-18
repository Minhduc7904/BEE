import type {
  PaymentAttemptStatus,
  PaymentConfirmationMode,
  PaymentIntentStatus,
  TuitionPaymentStatus,
} from '../../shared/enums'

/** Con trỏ phân trang học phí: khóa sắp xếp ổn định (năm, tháng, paymentId). */
export interface ParentTuitionCursor {
  year: number
  month: number
  paymentId: number
}

const TUITION_CURSOR_PATTERN = /^(\d+)_(\d+)_(\d+)$/

export function encodeTuitionCursor(cursor: ParentTuitionCursor): string {
  return `${cursor.year}_${cursor.month}_${cursor.paymentId}`
}

export function decodeTuitionCursor(raw: string): ParentTuitionCursor | null {
  const match = TUITION_CURSOR_PATTERN.exec(raw)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]), paymentId: Number(match[3]) }
}

/** Khoản học phí như được lưu; hạn đóng hiệu lực do use case suy ra, không đọc từ database. */
export interface ParentTuitionPaymentRecord {
  paymentId: number
  studentId: number
  month: number
  year: number
  /** VND; null = chưa xác định, 0 = miễn phí. */
  amount: number | null
  status: TuitionPaymentStatus
  paidAt: Date | null
  /** Thời điểm phụ huynh báo đã chuyển khoản; null = chưa báo. */
  payerReportedTransferredAt: Date | null
}

export interface ParentTuitionPaymentIntentRecord {
  paymentIntentId: number
  status: PaymentIntentStatus
  updatedAt: Date
}

/** Một lần hiển thị QR; không chứa payload SePay, giao dịch ngân hàng hay ghi chú đối soát. */
export interface ParentTuitionAttemptRecord {
  paymentAttemptId: number
  attemptCode: string
  amount: number
  confirmationMode: PaymentConfirmationMode
  status: PaymentAttemptStatus
  createdAt: Date
  expiresAt: Date
}

export interface ParentTuitionPaymentDetailRecord extends ParentTuitionPaymentRecord {
  /** null khi khoản học phí chưa từng mở QR (intent được tạo lười ở lần lấy hướng dẫn đầu tiên). */
  paymentIntent: ParentTuitionPaymentIntentRecord | null
  /** Mới nhất trước. */
  attempts: ParentTuitionAttemptRecord[]
}

export interface ParentTuitionPaymentListQuery {
  status: TuitionPaymentStatus
  after: ParentTuitionCursor | null
  limit: number
}

export interface ParentTuitionPaymentPage {
  data: ParentTuitionPaymentRecord[]
  hasNext: boolean
  nextCursor: string | null
}

export abstract class ParentStudentTuitionReadService {
  abstract isStudentLinked(parentId: number, studentId: number): Promise<boolean>

  /**
   * UNPAID: kỳ cũ nhất trước (năm, tháng, id tăng dần) vì hạn đóng là cuối tháng của kỳ.
   * PAID: kỳ mới nhất trước (năm, tháng, id giảm dần).
   */
  abstract listPayments(studentId: number, query: ParentTuitionPaymentListQuery): Promise<ParentTuitionPaymentPage>

  /** Trả null khi khoản học phí không tồn tại hoặc không thuộc học sinh. */
  abstract findPaymentDetail(studentId: number, paymentId: number): Promise<ParentTuitionPaymentDetailRecord | null>
}
