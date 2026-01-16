// src/shared/enums/payment-type.enum.ts

/**
 * Payment Type Enum
 * Đồng bộ với Prisma schema enum PaymentType
 */
export enum PaymentType {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  LESSON = 'LESSON',
}

/**
 * Payment Type Labels
 */
export const PaymentTypeLabels: Record<PaymentType, string> = {
  [PaymentType.ONE_TIME]: 'Một lần',
  [PaymentType.MONTHLY]: 'Theo tháng',
  [PaymentType.LESSON]: 'Theo buổi',
}

/**
 * Payment Type Descriptions
 */
export const PaymentTypeDescriptions: Record<PaymentType, string> = {
  [PaymentType.ONE_TIME]: 'Đóng 1 lần cho toàn bộ khóa học',
  [PaymentType.MONTHLY]: 'Đóng học phí theo từng tháng',
  [PaymentType.LESSON]: 'Đóng học phí theo từng buổi học',
}

/**
 * Payment Type Icons
 */
export const PaymentTypeIcons: Record<PaymentType, string> = {
  [PaymentType.ONE_TIME]: '💰',
  [PaymentType.MONTHLY]: '📅',
  [PaymentType.LESSON]: '📚',
}
