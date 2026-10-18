import type { ParentTuitionPaymentDetailRecord } from '../../interfaces'
import { ParentTuitionAttemptHistoryItemDto } from './parent-tuition-attempt-history-item.dto'
import { ParentTuitionPaymentIntentSnapshotDto } from './parent-tuition-payment-intent-snapshot.dto'
import { ParentTuitionPaymentListItemDto } from './parent-tuition-payment-list-item.dto'

export class ParentTuitionPaymentDetailDto extends ParentTuitionPaymentListItemDto {
  /** null khi khoản học phí chưa từng mở QR (intent được tạo lười ở lần lấy hướng dẫn đầu tiên). */
  paymentIntent: ParentTuitionPaymentIntentSnapshotDto | null
  /** Lịch sử các lần hiển thị QR, mới nhất trước. */
  attempts: ParentTuitionAttemptHistoryItemDto[]

  static fromDetailRecord(record: ParentTuitionPaymentDetailRecord, now: Date): ParentTuitionPaymentDetailDto {
    return {
      ...ParentTuitionPaymentListItemDto.fromRecord(record, now),
      paymentIntent: record.paymentIntent
        ? ParentTuitionPaymentIntentSnapshotDto.fromRecord(record.paymentIntent)
        : null,
      attempts: record.attempts.map(ParentTuitionAttemptHistoryItemDto.fromRecord),
    }
  }
}
