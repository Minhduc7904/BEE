import type { PaymentAttempt as PrismaPaymentAttempt } from '@prisma/client'

import { PaymentAttempt } from '../../../domain/entities/tuition-online-payment'
import {
  PaymentAttemptStatus,
  PaymentBankSelectionSource,
  PaymentConfirmationMode,
} from '../../../shared/enums'

export class PaymentAttemptMapper {
  static toDomain(prismaPaymentAttempt: PrismaPaymentAttempt | null | undefined): PaymentAttempt | null {
    if (!prismaPaymentAttempt) return null

    return new PaymentAttempt({
      paymentAttemptId: prismaPaymentAttempt.paymentAttemptId,
      paymentIntentId: prismaPaymentAttempt.paymentIntentId,
      attemptCode: prismaPaymentAttempt.attemptCode,
      receivingBankAccountId: prismaPaymentAttempt.receivingBankAccountId,
      amount: prismaPaymentAttempt.amount,
      currency: prismaPaymentAttempt.currency,
      bankSelectionSource: prismaPaymentAttempt.bankSelectionSource as PaymentBankSelectionSource,
      confirmationMode: prismaPaymentAttempt.confirmationMode as PaymentConfirmationMode,
      status: prismaPaymentAttempt.status as PaymentAttemptStatus,
      qrCodeUrl: prismaPaymentAttempt.qrCodeUrl,
      expiresAt: prismaPaymentAttempt.expiresAt,
      createdAt: prismaPaymentAttempt.createdAt,
      updatedAt: prismaPaymentAttempt.updatedAt,
    })
  }

  static toDomainList(prismaPaymentAttempts: PrismaPaymentAttempt[] | null | undefined): PaymentAttempt[] {
    if (!prismaPaymentAttempts?.length) return []

    return prismaPaymentAttempts
      .map((item) => this.toDomain(item))
      .filter((item): item is PaymentAttempt => item !== null)
  }
}
