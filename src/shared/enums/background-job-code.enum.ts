/**
 * Đồng bộ với Prisma enum BackgroundJobCode.
 * Danh sách job nền là contract do source code quản lý.
 */
export enum BackgroundJobCode {
  SEPAY_TRANSACTION_SYNC = 'SEPAY_TRANSACTION_SYNC',
  ASSISTANT_SHIFT_REMINDER = 'ASSISTANT_SHIFT_REMINDER',
  AUDIT_LOG_RETENTION_CLEANUP = 'AUDIT_LOG_RETENTION_CLEANUP',
  BACKGROUND_JOB_RUN_RETENTION_CLEANUP = 'BACKGROUND_JOB_RUN_RETENTION_CLEANUP',
  COMPETITION_SUBMISSION_AUTO_SUBMIT = 'COMPETITION_SUBMISSION_AUTO_SUBMIT',
  USER_REFRESH_TOKEN_CLEANUP = 'USER_REFRESH_TOKEN_CLEANUP',
}

export const BackgroundJobCodeLabels: Record<BackgroundJobCode, string> = {
  [BackgroundJobCode.SEPAY_TRANSACTION_SYNC]: 'Đồng bộ giao dịch SePay',
  [BackgroundJobCode.ASSISTANT_SHIFT_REMINDER]: 'Nhắc lịch và xác nhận vắng trợ giảng',
  [BackgroundJobCode.AUDIT_LOG_RETENTION_CLEANUP]: 'Dọn audit log quá hạn',
  [BackgroundJobCode.BACKGROUND_JOB_RUN_RETENTION_CLEANUP]: 'Dọn lịch sử chạy job quá hạn',
  [BackgroundJobCode.COMPETITION_SUBMISSION_AUTO_SUBMIT]: 'Tự động nộp bài thi khi hết giờ',
  [BackgroundJobCode.USER_REFRESH_TOKEN_CLEANUP]: 'Dọn refresh token hết hạn',
}
