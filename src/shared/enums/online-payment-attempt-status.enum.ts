// src/shared/enums/online-payment-attempt-status.enum.ts

export enum OnlinePaymentAttemptStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export const OnlinePaymentAttemptStatusLabels: Record<OnlinePaymentAttemptStatus, string> = {
  [OnlinePaymentAttemptStatus.PENDING]: 'Cho xu ly',
  [OnlinePaymentAttemptStatus.PROCESSING]: 'Dang xu ly',
  [OnlinePaymentAttemptStatus.SUCCEEDED]: 'Thanh cong',
  [OnlinePaymentAttemptStatus.FAILED]: 'That bai',
  [OnlinePaymentAttemptStatus.CANCELLED]: 'Da huy',
  [OnlinePaymentAttemptStatus.EXPIRED]: 'Het han',
}
