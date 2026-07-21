import type { PaymentIntent } from 'src/domain/entities/tuition-online-payment'
import type { TuitionPayment } from 'src/domain/entities/tuition-payment'
import { PaymentIntentResponseDto } from '../payment-intent/payment-intent.dto'
import { TuitionPaymentResponseDto } from './tuition-payment.dto'

/** Snapshot payment intent dành cho danh sách học phí quản trị. */
export class AdminTuitionPaymentResponseDto extends TuitionPaymentResponseDto {
  paymentIntent: PaymentIntentResponseDto | null

  constructor(tuitionPayment: TuitionPayment, paymentIntent: PaymentIntent | null) {
    super(tuitionPayment)
    this.paymentIntent = paymentIntent ? PaymentIntentResponseDto.fromPaymentIntent(paymentIntent) : null
  }
}
