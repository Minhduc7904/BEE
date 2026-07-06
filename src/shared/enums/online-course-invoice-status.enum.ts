// src/shared/enums/online-course-invoice-status.enum.ts

export enum OnlineCourseInvoiceStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export const OnlineCourseInvoiceStatusLabels: Record<OnlineCourseInvoiceStatus, string> = {
  [OnlineCourseInvoiceStatus.PENDING_PAYMENT]: 'Cho thanh toan',
  [OnlineCourseInvoiceStatus.PAID]: 'Da thanh toan',
  [OnlineCourseInvoiceStatus.PAYMENT_FAILED]: 'Thanh toan that bai',
  [OnlineCourseInvoiceStatus.CANCELLED]: 'Da huy',
  [OnlineCourseInvoiceStatus.EXPIRED]: 'Het han',
  [OnlineCourseInvoiceStatus.REFUNDED]: 'Da hoan tien',
  [OnlineCourseInvoiceStatus.PARTIALLY_REFUNDED]: 'Hoan tien mot phan',
}
