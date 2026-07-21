import { PaymentAttempt } from '../../../domain/entities/tuition-online-payment'
import {
  PaymentAttemptStatus,
  PaymentBankSelectionSource,
  PaymentConfirmationMode,
} from '../../../shared/enums'

export class PaymentInstructionReceivingBankAccountDto {
  receivingBankAccountId: number
  bankCode: string
  accountNumber: string
  accountHolder: string
  displayName?: string | null
}

export class PaymentInstructionResponseDto {
  tuitionPaymentId: number
  paymentIntentId: number
  paymentAttemptId: number
  attemptCode: string
  amount: number
  currency: string
  transferContent: string
  qrCodeUrl?: string | null
  expiresAt: Date
  status: PaymentAttemptStatus
  bankSelectionSource: PaymentBankSelectionSource
  confirmationMode: PaymentConfirmationMode
  receivingBankAccount: PaymentInstructionReceivingBankAccountDto

  static fromPaymentAttempt(
    tuitionPaymentId: number,
    paymentAttempt: PaymentAttempt,
    receivingBankAccount: PaymentInstructionReceivingBankAccountDto,
    transferContent: string,
  ): PaymentInstructionResponseDto {
    return {
      tuitionPaymentId,
      paymentIntentId: paymentAttempt.paymentIntentId,
      paymentAttemptId: paymentAttempt.paymentAttemptId,
      attemptCode: paymentAttempt.attemptCode,
      amount: paymentAttempt.amount,
      currency: paymentAttempt.currency,
      transferContent,
      qrCodeUrl: paymentAttempt.qrCodeUrl,
      expiresAt: paymentAttempt.expiresAt,
      status: paymentAttempt.status,
      bankSelectionSource: paymentAttempt.bankSelectionSource,
      confirmationMode: paymentAttempt.confirmationMode,
      receivingBankAccount,
    }
  }
}

export class CancelPaymentAttemptResponseDto {
  paymentAttemptId: number
  status: PaymentAttemptStatus
  expiresAt: Date

  static fromPaymentAttempt(paymentAttempt: PaymentAttempt): CancelPaymentAttemptResponseDto {
    return {
      paymentAttemptId: paymentAttempt.paymentAttemptId,
      status: paymentAttempt.status,
      expiresAt: paymentAttempt.expiresAt,
    }
  }
}
