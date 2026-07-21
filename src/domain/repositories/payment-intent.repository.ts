import { PaymentIntent } from '../entities/tuition-online-payment'
import {
  CreatePaymentIntentData,
  PaymentIntentListOptions,
  UpdatePaymentIntentData,
} from '../interface/tuition-online-payment'

export interface IPaymentIntentRepository {
  create(data: CreatePaymentIntentData): Promise<PaymentIntent>
  findById(paymentIntentId: number): Promise<PaymentIntent | null>
  findByTuitionPaymentId(tuitionPaymentId: number): Promise<PaymentIntent | null>
  findAll(options?: PaymentIntentListOptions): Promise<PaymentIntent[]>
  update(paymentIntentId: number, data: UpdatePaymentIntentData): Promise<PaymentIntent>
  delete(paymentIntentId: number): Promise<boolean>
}
