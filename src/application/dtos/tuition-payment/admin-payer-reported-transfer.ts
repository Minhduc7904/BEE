import type { TuitionPayment } from '../../../domain/entities/tuition-payment'

/**
 * Cờ phụ huynh báo đã chuyển khoản, chỉ dành cho API quản trị (API học sinh không trả cờ này).
 * Cờ chỉ là tín hiệu để trung tâm kiểm tra, không phải bằng chứng thanh toán.
 */
export interface AdminPayerReportedTransfer {
  payerReportedTransferred: boolean
  payerReportedTransferredAt: Date | null
  payerReportedTransferredByUserId: number | null
}

export function toAdminPayerReportedTransfer(tuitionPayment: TuitionPayment): AdminPayerReportedTransfer {
  return {
    payerReportedTransferred: tuitionPayment.hasPayerReportedTransfer(),
    payerReportedTransferredAt: tuitionPayment.payerReportedTransferredAt ?? null,
    payerReportedTransferredByUserId: tuitionPayment.payerReportedTransferredByUserId ?? null,
  }
}
