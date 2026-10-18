import type { PaymentAttemptStatus, PaymentConfirmationMode } from '../../../shared/enums'
import type { ParentTuitionAttemptRecord } from '../../interfaces'

export class ParentTuitionAttemptHistoryItemDto {
  paymentAttemptId: number
  attemptCode: string
  amount: number
  confirmationMode: PaymentConfirmationMode
  status: PaymentAttemptStatus
  createdAt: string
  expiresAt: string

  static fromRecord(record: ParentTuitionAttemptRecord): ParentTuitionAttemptHistoryItemDto {
    return {
      paymentAttemptId: record.paymentAttemptId,
      attemptCode: record.attemptCode,
      amount: record.amount,
      confirmationMode: record.confirmationMode,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
    }
  }
}
