import { PaymentIntent } from 'src/domain/entities/tuition-online-payment'
import { TuitionPayment } from 'src/domain/entities/tuition-payment/tuition-payment.entity'
import { PaymentIntentStatus, TuitionPaymentStatus } from 'src/shared/enums'

export class TuitionPaymentIntentStatusResponseDto {
  paymentIntentId: number
  tuitionPaymentId: number
  tuitionPaymentStatus: TuitionPaymentStatus
  intentStatus: PaymentIntentStatus
  paidAt: Date | null
  intentUpdatedAt: Date

  static fromEntities(
    tuitionPayment: TuitionPayment,
    paymentIntent: PaymentIntent,
  ): TuitionPaymentIntentStatusResponseDto {
    return {
      paymentIntentId: paymentIntent.paymentIntentId,
      tuitionPaymentId: tuitionPayment.paymentId,
      tuitionPaymentStatus: tuitionPayment.status,
      intentStatus: paymentIntent.status,
      paidAt: tuitionPayment.paidAt ?? null,
      intentUpdatedAt: paymentIntent.updatedAt,
    }
  }
}
