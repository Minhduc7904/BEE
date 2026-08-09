import { PaymentIntentStatus } from '../../shared/enums'

export type CoursePaymentIntentStatusPayload = {
  paymentIntentId: number
  courseEnrollmentId: number
  intentStatus: PaymentIntentStatus
  paidAt: Date | null
  intentUpdatedAt: Date
}

export abstract class CoursePaymentIntentRealtimeService {
  abstract notifyIntentPaid(payload: CoursePaymentIntentStatusPayload): void
}
