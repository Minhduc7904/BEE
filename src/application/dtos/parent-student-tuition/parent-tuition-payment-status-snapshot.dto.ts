import type { TuitionPaymentStatus } from '../../../shared/enums'
import type { ParentTuitionPaymentDetailRecord } from '../../interfaces'
import { ParentTuitionPaymentIntentSnapshotDto } from './parent-tuition-payment-intent-snapshot.dto'

/** Snapshot REST authoritative của trạng thái thanh toán; `paymentIntent` null khi chưa từng mở QR. */
export class ParentTuitionPaymentStatusSnapshotDto {
  tuitionPaymentId: number
  tuitionPaymentStatus: TuitionPaymentStatus
  paidAt: string | null
  payerReportedTransferred: boolean
  payerReportedTransferredAt: string | null
  paymentIntent: ParentTuitionPaymentIntentSnapshotDto | null

  static fromRecord(
    record: Pick<
      ParentTuitionPaymentDetailRecord,
      'paymentId' | 'status' | 'paidAt' | 'payerReportedTransferredAt' | 'paymentIntent'
    >,
  ): ParentTuitionPaymentStatusSnapshotDto {
    return {
      tuitionPaymentId: record.paymentId,
      tuitionPaymentStatus: record.status,
      paidAt: record.paidAt ? record.paidAt.toISOString() : null,
      payerReportedTransferred: record.payerReportedTransferredAt !== null,
      payerReportedTransferredAt: record.payerReportedTransferredAt
        ? record.payerReportedTransferredAt.toISOString()
        : null,
      paymentIntent: record.paymentIntent
        ? ParentTuitionPaymentIntentSnapshotDto.fromRecord(record.paymentIntent)
        : null,
    }
  }
}
