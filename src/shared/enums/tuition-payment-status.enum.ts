// src/shared/enums/tuition-payment-status.enum.ts

/**
 * Tuition Payment Status Enum
 * Đồng bộ 100% với Prisma schema enum TuitionPaymentStatus
 */
export enum TuitionPaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
}

/**
 * Tuition Payment Status Labels
 */
export const TuitionPaymentStatusLabels: Record<TuitionPaymentStatus, string> = {
  [TuitionPaymentStatus.UNPAID]: 'Chưa nộp',
  [TuitionPaymentStatus.PAID]: 'Đã nộp',
}

/**
 * Tuition Payment Status Descriptions
 */
export const TuitionPaymentStatusDescriptions: Record<TuitionPaymentStatus, string> = {
  [TuitionPaymentStatus.UNPAID]: 'Học phí chưa được thanh toán',
  [TuitionPaymentStatus.PAID]: 'Học phí đã được thanh toán đầy đủ',
}

/**
 * Tuition Payment Status Colors
 */
export const TuitionPaymentStatusColors: Record<TuitionPaymentStatus, string> = {
  [TuitionPaymentStatus.UNPAID]: 'red',
  [TuitionPaymentStatus.PAID]: 'green',
}

/**
 * Tuition Payment Status Icons
 */
export const TuitionPaymentStatusIcons: Record<TuitionPaymentStatus, string> = {
  [TuitionPaymentStatus.UNPAID]: '💸',
  [TuitionPaymentStatus.PAID]: '💰',
}
