/**
 * Đồng bộ với Prisma enum BackgroundJobCode.
 * Danh sách job nền là contract do source code quản lý.
 */
export enum BackgroundJobCode {
  SEPAY_TRANSACTION_SYNC = 'SEPAY_TRANSACTION_SYNC',
}

export const BackgroundJobCodeLabels: Record<BackgroundJobCode, string> = {
  [BackgroundJobCode.SEPAY_TRANSACTION_SYNC]: 'Đồng bộ giao dịch SePay',
}
