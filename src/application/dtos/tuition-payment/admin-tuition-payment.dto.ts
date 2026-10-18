import type { PaymentIntent } from 'src/domain/entities/tuition-online-payment'
import type { TuitionPayment } from 'src/domain/entities/tuition-payment'
import { PaymentIntentResponseDto } from '../payment-intent/payment-intent.dto'
import { AdminPayerReportedTransfer, toAdminPayerReportedTransfer } from './admin-payer-reported-transfer'
import { TuitionPaymentResponseDto } from './tuition-payment.dto'

/** Snapshot payment intent dành cho danh sách học phí quản trị. */
export class AdminTuitionPaymentResponseDto extends TuitionPaymentResponseDto implements AdminPayerReportedTransfer {
  paymentIntent: PaymentIntentResponseDto | null
  payerReportedTransferred: boolean
  payerReportedTransferredAt: Date | null
  payerReportedTransferredByUserId: number | null

  constructor(tuitionPayment: TuitionPayment, paymentIntent: PaymentIntent | null) {
    super(tuitionPayment)
    Object.assign(this, toAdminPayerReportedTransfer(tuitionPayment))
    this.paymentIntent = paymentIntent ? PaymentIntentResponseDto.fromPaymentIntent(paymentIntent) : null
  }
}
