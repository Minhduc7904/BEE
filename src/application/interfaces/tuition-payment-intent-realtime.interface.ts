import { PaymentIntentStatus, TuitionPaymentStatus } from 'src/shared/enums'

export type TuitionPaymentIntentStatusPayload = {
  paymentIntentId: number
  tuitionPaymentId: number
  tuitionPaymentStatus: TuitionPaymentStatus
  intentStatus: PaymentIntentStatus
  paidAt: Date | null
  intentUpdatedAt: Date
}

/** Application port used to publish the committed tuition-payment intent state. */
export abstract class TuitionPaymentIntentRealtimeService {
  abstract notifyIntentPaid(payload: TuitionPaymentIntentStatusPayload): void
}
