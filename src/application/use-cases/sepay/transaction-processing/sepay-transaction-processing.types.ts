import type { JsonPayload } from 'src/domain/interface/tuition-online-payment'
import { BankTransferProcessingStatus, PaymentIntentStatus, TuitionPaymentStatus } from 'src/shared/enums'

export interface PaymentInstructionReference {
  attemptCode: string
  tuitionPaymentId: number
}

export interface IncomingSepayTransaction {
  providerTransactionId: string
  sepayV2TransactionId?: string | null
  transactionAt: Date
  receivingAccountNumber: string
  transferType: string
  transferAmount: number
  code?: string | null
  content?: string | null
  reference?: string | null
  rawPayload: JsonPayload
}

export interface ProcessSepayTransactionResult {
  duplicate: boolean
  processingStatus: BankTransferProcessingStatus
  paymentId?: number
  studentUserId?: number
  paymentIntentId?: number
  tuitionPaymentStatus?: TuitionPaymentStatus
  intentStatus?: PaymentIntentStatus
  paidAt?: Date | null
  intentUpdatedAt?: Date
}
