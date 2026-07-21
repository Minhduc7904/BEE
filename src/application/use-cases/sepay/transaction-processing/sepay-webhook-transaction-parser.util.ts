import { BadRequestException } from '@nestjs/common'
import type { JsonPayload } from 'src/domain/interface/tuition-online-payment'
import { parseSepayTransactionDate } from './sepay-transaction-date.util'
import type { IncomingSepayTransaction } from './sepay-transaction-processing.types'

export const parseSepayWebhookTransaction = (body: unknown): IncomingSepayTransaction => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Payload webhook SePay không hợp lệ')
  }

  const payload = body as Record<string, unknown>
  if (
    (typeof payload.id !== 'number' && typeof payload.id !== 'string') ||
    !String(payload.id).trim() ||
    (typeof payload.id === 'number' && !Number.isSafeInteger(payload.id)) ||
    typeof payload.transactionDate !== 'string' ||
    typeof payload.accountNumber !== 'string' ||
    !payload.accountNumber.trim() ||
    typeof payload.transferType !== 'string' ||
    typeof payload.transferAmount !== 'number' ||
    !Number.isFinite(payload.transferAmount) ||
    payload.transferAmount <= 0
  ) {
    throw new BadRequestException('Payload webhook SePay thiếu hoặc sai trường bắt buộc')
  }

  return {
    providerTransactionId: String(payload.id).trim(),
    transactionAt: parseSepayTransactionDate(payload.transactionDate),
    receivingAccountNumber: payload.accountNumber.trim(),
    transferType: payload.transferType,
    transferAmount: payload.transferAmount,
    code: optionalString(payload.code),
    content: optionalString(payload.content) ?? optionalString(payload.description),
    reference: optionalString(payload.referenceCode),
    rawPayload: body as JsonPayload,
  }
}

const optionalString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null
