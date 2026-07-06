import { OnlineCoursePaymentAttempt } from '../entities/online-course-payment'
import { OnlinePaymentAttemptStatus, OnlinePaymentProvider } from '../../shared/enums'

export interface CreateOnlineCoursePaymentAttemptData {
  attemptCode: string
  invoiceId: number
  provider: OnlinePaymentProvider
  status?: OnlinePaymentAttemptStatus
  amount: number
  currency?: string
  providerOrderId: string
  qrContent?: string | null
  providerTransactionId?: string | null
  providerResponseCode?: string | null
  providerMessage?: string | null
  providerBankCode?: string | null
  providerBankTranNo?: string | null
  providerCardType?: string | null
  providerPayDate?: string | null
  checkoutUrl?: string | null
  qrCodeUrl?: string | null
  requestPayload?: any
  responsePayload?: any
  callbackPayload?: any
  paidAt?: Date | null
  failedAt?: Date | null
  canceledAt?: Date | null
  expiredAt?: Date | null
  cancelReason?: string | null
}

export interface UpdateOnlineCoursePaymentAttemptData {
  status?: OnlinePaymentAttemptStatus
  qrContent?: string | null
  providerTransactionId?: string | null
  providerResponseCode?: string | null
  providerMessage?: string | null
  providerBankCode?: string | null
  providerBankTranNo?: string | null
  providerCardType?: string | null
  providerPayDate?: string | null
  checkoutUrl?: string | null
  qrCodeUrl?: string | null
  requestPayload?: any
  responsePayload?: any
  callbackPayload?: any
  paidAt?: Date | null
  failedAt?: Date | null
  canceledAt?: Date | null
  expiredAt?: Date | null
  cancelReason?: string | null
}

export interface MarkOnlinePaymentAttemptSucceededData {
  providerTransactionId?: string | null
  providerResponseCode?: string | null
  providerMessage?: string | null
  providerBankCode?: string | null
  providerBankTranNo?: string | null
  providerCardType?: string | null
  providerPayDate?: string | null
  callbackPayload?: any
  paidAt?: Date
}

export interface IOnlineCoursePaymentAttemptRepository {
  create(data: CreateOnlineCoursePaymentAttemptData): Promise<OnlineCoursePaymentAttempt>
  findById(attemptId: number): Promise<OnlineCoursePaymentAttempt | null>
  findByAttemptCode(attemptCode: string): Promise<OnlineCoursePaymentAttempt | null>
  findByProviderOrder(
    provider: OnlinePaymentProvider,
    providerOrderId: string,
  ): Promise<OnlineCoursePaymentAttempt | null>
  findSucceededByInvoice(invoiceId: number): Promise<OnlineCoursePaymentAttempt | null>
  update(attemptId: number, data: UpdateOnlineCoursePaymentAttemptData): Promise<OnlineCoursePaymentAttempt>
  markSucceeded(attemptId: number, data: MarkOnlinePaymentAttemptSucceededData): Promise<OnlineCoursePaymentAttempt>
  markFailed(
    attemptId: number,
    responseCode?: string | null,
    message?: string | null,
    payload?: any,
  ): Promise<OnlineCoursePaymentAttempt>
  markCanceled(attemptId: number, reason?: string | null): Promise<OnlineCoursePaymentAttempt>
  markExpired(attemptId: number): Promise<OnlineCoursePaymentAttempt>
}
