import type { PaymentIntent as PrismaPaymentIntent } from '@prisma/client'

import { PaymentIntent } from '../../../domain/entities/tuition-online-payment'
import { PaymentIntentStatus } from '../../../shared/enums'

export class PaymentIntentMapper {
  static toDomain(prismaPaymentIntent: PrismaPaymentIntent | null | undefined): PaymentIntent | null {
    if (!prismaPaymentIntent) return null

    return new PaymentIntent({
      paymentIntentId: prismaPaymentIntent.paymentIntentId,
      tuitionPaymentId: prismaPaymentIntent.tuitionPaymentId,
      amount: prismaPaymentIntent.amount,
      currency: prismaPaymentIntent.currency,
      status: prismaPaymentIntent.status as PaymentIntentStatus,
      expiresAt: prismaPaymentIntent.expiresAt,
      createdAt: prismaPaymentIntent.createdAt,
      updatedAt: prismaPaymentIntent.updatedAt,
    })
  }

  static toDomainList(prismaPaymentIntents: PrismaPaymentIntent[] | null | undefined): PaymentIntent[] {
    if (!prismaPaymentIntents?.length) return []

    return prismaPaymentIntents
      .map((item) => this.toDomain(item))
      .filter((item): item is PaymentIntent => item !== null)
  }
}
