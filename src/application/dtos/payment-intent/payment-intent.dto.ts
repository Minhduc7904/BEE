import { PaymentIntent } from '../../../domain/entities/tuition-online-payment'
import { PaymentIntentStatus } from '../../../shared/enums'
import { IsRequiredInt } from '../../../shared/decorators/validate'

export class CreatePaymentIntentsByGradePeriodDto {
  @IsRequiredInt('Khối', 1, 12)
  grade: number

  @IsRequiredInt('Tháng', 1, 12)
  month: number

  @IsRequiredInt('Năm', 2000)
  year: number
}

export class PaymentIntentResponseDto {
  paymentIntentId: number
  tuitionPaymentId: number
  amount: number
  currency: string
  status: PaymentIntentStatus
  expiresAt?: Date | null
  createdAt: Date
  updatedAt: Date

  static fromPaymentIntent(paymentIntent: PaymentIntent): PaymentIntentResponseDto {
    return {
      paymentIntentId: paymentIntent.paymentIntentId,
      tuitionPaymentId: paymentIntent.tuitionPaymentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      expiresAt: paymentIntent.expiresAt,
      createdAt: paymentIntent.createdAt,
      updatedAt: paymentIntent.updatedAt,
    }
  }
}

export class CreatePaymentIntentResponseDto {
  created: boolean
  paymentIntent: PaymentIntentResponseDto
}

export class CreatePaymentIntentsByGradePeriodResponseDto {
  totalEligible: number
  created: PaymentIntentResponseDto[]
  existingPaymentIntentCount: number
}
