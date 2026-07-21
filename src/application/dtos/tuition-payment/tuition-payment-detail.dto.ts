import type {
  BankTransferTransaction,
  PaymentAttempt,
  PaymentIntent,
} from '../../../domain/entities/tuition-online-payment'
import type { TuitionPayment } from '../../../domain/entities/tuition-payment'
import {
  PaymentAttemptStatus,
  PaymentBankSelectionSource,
  PaymentConfirmationMode,
  PaymentIntentStatus,
} from '../../../shared/enums'
import { BankTransferTransactionResponseDto } from '../bank-transfer-transaction'
import { TuitionPaymentResponseDto } from './tuition-payment.dto'

export class TuitionPaymentAttemptDetailResponseDto {
  paymentAttemptId: number
  attemptCode: string
  receivingBankAccountId: number
  amount: number
  currency: string
  bankSelectionSource: PaymentBankSelectionSource
  confirmationMode: PaymentConfirmationMode
  status: PaymentAttemptStatus
  qrCodeUrl?: string | null
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  bankTransferTransactions: BankTransferTransactionResponseDto[]

  static fromPaymentAttempt(
    paymentAttempt: PaymentAttempt,
    bankTransferTransactions: BankTransferTransaction[],
  ): TuitionPaymentAttemptDetailResponseDto {
    return {
      paymentAttemptId: paymentAttempt.paymentAttemptId,
      attemptCode: paymentAttempt.attemptCode,
      receivingBankAccountId: paymentAttempt.receivingBankAccountId,
      amount: paymentAttempt.amount,
      currency: paymentAttempt.currency,
      bankSelectionSource: paymentAttempt.bankSelectionSource,
      confirmationMode: paymentAttempt.confirmationMode,
      status: paymentAttempt.status,
      qrCodeUrl: paymentAttempt.qrCodeUrl,
      expiresAt: paymentAttempt.expiresAt,
      createdAt: paymentAttempt.createdAt,
      updatedAt: paymentAttempt.updatedAt,
      bankTransferTransactions: BankTransferTransactionResponseDto.fromBankTransferTransactionList(
        bankTransferTransactions,
      ),
    }
  }
}

export class TuitionPaymentIntentDetailResponseDto {
  paymentIntentId: number
  tuitionPaymentId: number
  amount: number
  currency: string
  status: PaymentIntentStatus
  expiresAt?: Date | null
  createdAt: Date
  updatedAt: Date
  paymentAttempts: TuitionPaymentAttemptDetailResponseDto[]

  static fromPaymentIntent(
    paymentIntent: PaymentIntent,
    paymentAttempts: Array<{
      paymentAttempt: PaymentAttempt
      bankTransferTransactions: BankTransferTransaction[]
    }>,
  ): TuitionPaymentIntentDetailResponseDto {
    return {
      paymentIntentId: paymentIntent.paymentIntentId,
      tuitionPaymentId: paymentIntent.tuitionPaymentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      expiresAt: paymentIntent.expiresAt,
      createdAt: paymentIntent.createdAt,
      updatedAt: paymentIntent.updatedAt,
      paymentAttempts: paymentAttempts.map(({ paymentAttempt, bankTransferTransactions }) =>
        TuitionPaymentAttemptDetailResponseDto.fromPaymentAttempt(
          paymentAttempt,
          bankTransferTransactions,
        ),
      ),
    }
  }
}

export class TuitionPaymentDetailResponseDto extends TuitionPaymentResponseDto {
  paymentIntent: TuitionPaymentIntentDetailResponseDto | null

  static fromTuitionPayment(
    tuitionPayment: TuitionPayment,
    paymentIntent: PaymentIntent | null,
    paymentAttempts: Array<{
      paymentAttempt: PaymentAttempt
      bankTransferTransactions: BankTransferTransaction[]
    }>,
  ): TuitionPaymentDetailResponseDto {
    return {
      ...TuitionPaymentResponseDto.fromEntity(tuitionPayment),
      paymentIntent: paymentIntent
        ? TuitionPaymentIntentDetailResponseDto.fromPaymentIntent(paymentIntent, paymentAttempts)
        : null,
    }
  }
}
