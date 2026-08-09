import type { PaymentInstructionReference } from './sepay-transaction-processing.types'
import { BankTransferTransactionType } from 'src/shared/enums'

export const extractPaymentInstructionReference = (
  content: string | null | undefined,
): PaymentInstructionReference | null => {
  if (!content?.trim()) return null

  const tuitionMatch =
    /^\s*(HP[A-Z0-9]{5})\s+TP(\d+)(?:\s+|\s*$)/i.exec(content) ??
    /^\s*(HP[A-Z0-9]{5})\s*\|\s*TP:(\d+)(?:\s*\||\s*$)/i.exec(content)
  if (tuitionMatch) {
    const tuitionPaymentId = Number(tuitionMatch[2])
    if (!Number.isSafeInteger(tuitionPaymentId) || tuitionPaymentId <= 0) return null
    return {
      attemptCode: tuitionMatch[1].toUpperCase(),
      type: BankTransferTransactionType.TUITION_PAYMENT,
      tuitionPaymentId,
    }
  }

  const courseMatch = /^\s*(KH[A-Z0-9]{5})\s+CE(\d+)(?:\s+|\s*$)/i.exec(content)
  if (!courseMatch) return null
  const courseEnrollmentId = Number(courseMatch[2])
  if (!Number.isSafeInteger(courseEnrollmentId) || courseEnrollmentId <= 0) return null
  return {
    attemptCode: courseMatch[1].toUpperCase(),
    type: BankTransferTransactionType.COURSE_PURCHASE,
    courseEnrollmentId,
  }
}
