/**
 * Đồng bộ với Prisma enum BackgroundJobCode.
 * Danh sách job nền là contract do source code quản lý.
 */
export enum BackgroundJobCode {
  SEPAY_TRANSACTION_SYNC = 'SEPAY_TRANSACTION_SYNC',
  ASSISTANT_SHIFT_REMINDER = 'ASSISTANT_SHIFT_REMINDER',
}

export const BackgroundJobCodeLabels: Record<BackgroundJobCode, string> = {
  [BackgroundJobCode.SEPAY_TRANSACTION_SYNC]: 'Đồng bộ giao dịch SePay',
  [BackgroundJobCode.ASSISTANT_SHIFT_REMINDER]: 'Nhắc lịch và xác nhận vắng trợ giảng',
}
