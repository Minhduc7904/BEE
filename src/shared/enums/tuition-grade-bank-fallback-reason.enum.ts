/** Lý do một khối dùng tài khoản fallback thủ công thay vì xác nhận tự động. */
export enum TuitionGradeBankFallbackReason {
  COLLECTION_CONFIGURATION_MISSING = 'COLLECTION_CONFIGURATION_MISSING',
  COLLECTION_MODE_MANUAL_FALLBACK = 'COLLECTION_MODE_MANUAL_FALLBACK',
  GRADE_BANK_NOT_CONFIGURED = 'GRADE_BANK_NOT_CONFIGURED',
  GRADE_BANK_INACTIVE = 'GRADE_BANK_INACTIVE',
  SEPAY_BANK_STATUS_UNKNOWN = 'SEPAY_BANK_STATUS_UNKNOWN',
  SEPAY_BANK_INACTIVE = 'SEPAY_BANK_INACTIVE',
}

export const TuitionGradeBankFallbackReasonLabels: Record<TuitionGradeBankFallbackReason, string> = {
  [TuitionGradeBankFallbackReason.COLLECTION_CONFIGURATION_MISSING]: 'Chưa cấu hình thu học phí',
  [TuitionGradeBankFallbackReason.COLLECTION_MODE_MANUAL_FALLBACK]: 'Hệ thống đang ở chế độ fallback thủ công',
  [TuitionGradeBankFallbackReason.GRADE_BANK_NOT_CONFIGURED]: 'Khối chưa được gán tài khoản nhận tự động',
  [TuitionGradeBankFallbackReason.GRADE_BANK_INACTIVE]: 'Tài khoản nhận tiền của khối đang tắt',
  [TuitionGradeBankFallbackReason.SEPAY_BANK_STATUS_UNKNOWN]: 'Chưa đồng bộ trạng thái tài khoản từ SePay',
  [TuitionGradeBankFallbackReason.SEPAY_BANK_INACTIVE]: 'Tài khoản đang tạm khóa trên SePay',
}
