// src/shared/enums/tuition-payment-status.enum.ts

/**
 * Tuition Payment Status Enum
 * Đồng bộ 100% với Prisma schema enum TuitionPaymentStatus
 */
export enum TuitionPaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  LATE = 'LATE',
}

/**
 * Tuition Payment Status Labels
 */
export const TuitionPaymentStatusLabels: Record<TuitionPaymentStatus, string> = {
  [TuitionPaymentStatus.UNPAID]: 'Chưa nộp',
  [TuitionPaymentStatus.PAID]: 'Đã nộp',
  [TuitionPaymentStatus.LATE]: 'Nộp muộn',
}

/**
 * Tuition Payment Status Descriptions
 */
export const TuitionPaymentStatusDescriptions: Record<TuitionPaymentStatus, string> = {
  [TuitionPaymentStatus.UNPAID]: 'Học phí chưa được thanh toán',
  [TuitionPaymentStatus.PAID]: 'Học phí đã được thanh toán đầy đủ',
  [TuitionPaymentStatus.LATE]: 'Học phí được thanh toán sau thời hạn quy định',
}

/**
 * Tuition Payment Status Colors
 */
export const TuitionPaymentStatusColors: Record<TuitionPaymentStatus, string> = {
  [TuitionPaymentStatus.UNPAID]: 'red',
  [TuitionPaymentStatus.PAID]: 'green',
  [TuitionPaymentStatus.LATE]: 'orange',
}

/**
 * Tuition Payment Status Icons
 */
export const TuitionPaymentStatusIcons: Record<TuitionPaymentStatus, string> = {
  [TuitionPaymentStatus.UNPAID]: '💸',
  [TuitionPaymentStatus.PAID]: '💰',
  [TuitionPaymentStatus.LATE]: '⏰',
}
