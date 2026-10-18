import type { DueDateSource } from '../../../shared/enums/due-date-source.enum'
import { TuitionPaymentStatus } from '../../../shared/enums'
import type { ParentTuitionPaymentRecord } from '../../interfaces'
import {
  isTuitionOverdue,
  resolveTuitionDueDate,
} from '../../../domain/entities/tuition-payment/tuition-payment-due-date'

export class ParentTuitionPaymentListItemDto {
  paymentId: number
  month: number
  year: number
  /** VND; null = chưa xác định, 0 = miễn phí. */
  amount: number | null
  status: TuitionPaymentStatus
  paidAt: string | null
  effectiveDueDate: string
  dueDateSource: DueDateSource
  /** Chỉ true với khoản chưa đóng và đã quá hạn. */
  isOverdue: boolean
  payerReportedTransferred: boolean
  payerReportedTransferredAt: string | null

  static fromRecord(record: ParentTuitionPaymentRecord, now: Date): ParentTuitionPaymentListItemDto {
    // V1: schema chưa có cột dueDate nên explicitDueDate luôn null → hạn là cuối tháng (PERIOD_END).
    const { effectiveDueDate, source } = resolveTuitionDueDate({
      month: record.month,
      year: record.year,
      explicitDueDate: null,
    })
    return {
      paymentId: record.paymentId,
      month: record.month,
      year: record.year,
      amount: record.amount,
      status: record.status,
      paidAt: record.paidAt ? record.paidAt.toISOString() : null,
      effectiveDueDate: effectiveDueDate.toISOString(),
      dueDateSource: source,
      isOverdue: record.status === TuitionPaymentStatus.UNPAID && isTuitionOverdue(effectiveDueDate, now),
      payerReportedTransferred: record.payerReportedTransferredAt !== null,
      payerReportedTransferredAt: record.payerReportedTransferredAt
        ? record.payerReportedTransferredAt.toISOString()
        : null,
    }
  }
}
