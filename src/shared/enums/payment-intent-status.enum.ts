export enum PaymentIntentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export const PaymentIntentStatusLabels: Record<PaymentIntentStatus, string> = {
  [PaymentIntentStatus.PENDING]: 'Đang chờ thanh toán',
  [PaymentIntentStatus.PAID]: 'Đã thanh toán',
  [PaymentIntentStatus.CANCELLED]: 'Đã hủy',
  [PaymentIntentStatus.EXPIRED]: 'Đã hết hạn',
}
