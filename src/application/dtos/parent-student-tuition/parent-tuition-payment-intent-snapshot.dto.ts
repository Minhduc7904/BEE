import type { PaymentIntentStatus } from '../../../shared/enums'
import type { ParentTuitionPaymentIntentRecord } from '../../interfaces'

export class ParentTuitionPaymentIntentSnapshotDto {
  paymentIntentId: number
  intentStatus: PaymentIntentStatus
  intentUpdatedAt: string

  static fromRecord(record: ParentTuitionPaymentIntentRecord): ParentTuitionPaymentIntentSnapshotDto {
    return {
      paymentIntentId: record.paymentIntentId,
      intentStatus: record.status,
      intentUpdatedAt: record.updatedAt.toISOString(),
    }
  }
}
