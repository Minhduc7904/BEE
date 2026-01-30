import { TuitionPaymentStatus } from 'src/shared/enums'

/* ======================================================
 * RESPONSE ROOT
 * ====================================================== */
export interface TuitionPaymentImportPreviewResponse {
  summary: {
    totalRows: number          // Tổng số dòng trong excel (không tính header)
    validRows: number          // Tổng số dòng hợp lệ (new + existing + unchanged)
    newPayments: number        // Số học phí CHƯA CÓ (CREATE)
    existingPayments: number  // Số học phí ĐÃ CÓ & KHÁC (UPDATE)
    unchangedPayments: number // Số học phí ĐÃ CÓ & GIỐNG (SKIP)
    invalidRows: number       // Số dòng lỗi
  }

  /**
   * 🟢 CHƯA CÓ TRONG HỆ THỐNG
   * → khi confirm sẽ CREATE
   */
  newPayments: TuitionPaymentImportNewRow[]

  /**
   * 🟡 ĐÃ CÓ & KHÁC DỮ LIỆU
   * → khi confirm sẽ UPDATE
   */
  existingPayments: TuitionPaymentImportExistingRow[]

  /**
   * ⚪ ĐÃ CÓ NHƯNG KHÔNG ĐỔI
   * → khi confirm sẽ SKIP
   */
  unchangedPayments: TuitionPaymentImportUnchangedRow[]

  /**
   * 🔴 KHÔNG MAP ĐƯỢC
   * → user phải sửa lại excel
   */
  invalidRows: TuitionPaymentImportInvalidRow[]
}

/* ======================================================
 * COMMON STUDENT INFO
 * ====================================================== */
export interface TuitionPaymentImportStudentInfo {
  studentId: number
  fullName: string
  studentPhone?: string | null
  parentPhone?: string | null
}

/* ======================================================
 * PAYMENT SHAPE
 * ====================================================== */
export interface TuitionPaymentImportPayment {
  month: number
  year: number
  amount: number
  status: TuitionPaymentStatus
  paidAt?: Date | null
}

/* ======================================================
 * NEW PAYMENT (CREATE)
 * ====================================================== */
export interface TuitionPaymentImportNewRow {
  rowNumber: number
  student: TuitionPaymentImportStudentInfo
  payment: TuitionPaymentImportPayment
}

/* ======================================================
 * EXISTING PAYMENT (UPDATE)
 * ====================================================== */
export interface TuitionPaymentImportExistingRow {
  rowNumber: number
  tuitionPaymentId: number
  student: TuitionPaymentImportStudentInfo

  oldPayment: TuitionPaymentImportPayment
  newPayment: TuitionPaymentImportPayment
}

/* ======================================================
 * UNCHANGED PAYMENT (SKIP)
 * ====================================================== */
export interface TuitionPaymentImportUnchangedRow {
  rowNumber: number
  tuitionPaymentId: number
  student: TuitionPaymentImportStudentInfo
  payment: TuitionPaymentImportPayment
}

/* ======================================================
 * INVALID ROW
 * ====================================================== */
export interface TuitionPaymentImportInvalidRow {
  rowNumber: number

  reason:
  | 'MISSING_PHONE'
  | 'STUDENT_NOT_FOUND'
  | 'INVALID_AMOUNT'
  | 'INVALID_MONTH_YEAR'
  | 'DUPLICATE_ROW'
  | 'INVALID_DATA'
  | 'UNKNOWN_ERROR'

  message: string               // Thông báo cho người dùng
  rawData: Record<string, any>  // Dữ liệu gốc của dòng excel
}
