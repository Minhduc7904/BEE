import { TuitionPaymentStatus } from "src/shared/enums"

export interface TuitionPaymentImportPreviewResponse {
  summary: {
    totalRows: number // Tổng số dòng trong excel (không tính header)
    validRows: number // Số dòng map được học sinh
    existingPayments: number // Số học phí đã tồn tại (sẽ UPDATE)
    newPayments: number // Số học phí chưa có (sẽ CREATE)
    invalidRows: number // Số dòng lỗi / không tìm thấy
  }

  /**
   * 🟡 HỌC PHÍ ĐÃ CÓ TRONG HỆ THỐNG
   * → khi confirm sẽ UPDATE
   */
  existingPayments: TuitionPaymentImportMatchedRow[]

  /**
   * 🟢 HỌC PHÍ CHƯA CÓ
   * → khi confirm sẽ CREATE
   */
  newPayments: TuitionPaymentImportMatchedRow[]

  /**
   * 🔴 KHÔNG MAP ĐƯỢC
   * → user phải sửa lại excel
   */
  invalidRows: TuitionPaymentImportInvalidRow[]
}

export interface TuitionPaymentImportMatchedRow {
  rowNumber: number // Dòng excel (bắt đầu từ 2)

  student: {
    studentId: number
    fullName: string
    studentPhone?: string | null
    parentPhone?: string | null
  }

  payment: {
    month: number
    year: number
    amount: number
    status: TuitionPaymentStatus
    paidAt?: Date | null
  }

  /**
   * Chỉ có với existingPayments
   */
  existingPaymentId?: number
}

export interface TuitionPaymentImportInvalidRow {
  rowNumber: number

  reason:
    | 'MISSING_PHONE'
    | 'STUDENT_NOT_FOUND'
    | 'INVALID_AMOUNT'
    | 'INVALID_MONTH_YEAR'
    | 'DUPLICATE_ROW'
    | 'UNKNOWN_ERROR'

  message: string               // Thông báo cho người dùng
  rawData: Record<string, any>  // Dữ liệu gốc của dòng excel
}
