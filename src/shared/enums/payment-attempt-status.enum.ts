export enum PaymentAttemptStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export const PaymentAttemptStatusLabels: Record<PaymentAttemptStatus, string> = {
  [PaymentAttemptStatus.PENDING]: 'Đang chờ thanh toán',
  [PaymentAttemptStatus.SUCCEEDED]: 'Thanh toán thành công',
  [PaymentAttemptStatus.FAILED]: 'Thanh toán thất bại',
  [PaymentAttemptStatus.CANCELLED]: 'Đã hủy',
  [PaymentAttemptStatus.EXPIRED]: 'Đã hết hạn',
}
