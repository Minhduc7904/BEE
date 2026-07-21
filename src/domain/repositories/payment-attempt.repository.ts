import { PaymentAttempt } from '../entities/tuition-online-payment'
import {
  CreatePaymentAttemptData,
  PaymentAttemptListOptions,
  UpdatePaymentAttemptData,
} from '../interface/tuition-online-payment'

export interface IPaymentAttemptRepository {
  create(data: CreatePaymentAttemptData): Promise<PaymentAttempt>
  findById(paymentAttemptId: number): Promise<PaymentAttempt | null>
  findByAttemptCode(attemptCode: string): Promise<PaymentAttempt | null>
  findLatestPendingByPaymentIntent(paymentIntentId: number): Promise<PaymentAttempt | null>
  findAll(options?: PaymentAttemptListOptions): Promise<PaymentAttempt[]>
  update(paymentAttemptId: number, data: UpdatePaymentAttemptData): Promise<PaymentAttempt>
  deleteByPaymentIntentId(paymentIntentId: number): Promise<number>
}
