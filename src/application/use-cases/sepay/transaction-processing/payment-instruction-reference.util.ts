import type { PaymentInstructionReference } from './sepay-transaction-processing.types'

export const extractPaymentInstructionReference = (
  content: string | null | undefined,
): PaymentInstructionReference | null => {
  if (!content?.trim()) return null

  const match = /^\s*(HP[A-Z0-9]{5})\s+TP(\d+)(?:\s+|\s*$)/i.exec(content)
    ?? /^\s*(HP[A-Z0-9]{5})\s*\|\s*TP:(\d+)(?:\s*\||\s*$)/i.exec(content)
  if (!match) return null

  const tuitionPaymentId = Number(match[2])
  if (!Number.isSafeInteger(tuitionPaymentId) || tuitionPaymentId <= 0) return null

  return { attemptCode: match[1].toUpperCase(), tuitionPaymentId }
}
