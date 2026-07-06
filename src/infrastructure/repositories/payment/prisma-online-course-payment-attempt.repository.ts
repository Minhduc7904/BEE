import type {
  CreateOnlineCoursePaymentAttemptData,
  IOnlineCoursePaymentAttemptRepository,
  MarkOnlinePaymentAttemptSucceededData,
  UpdateOnlineCoursePaymentAttemptData,
} from '../../../domain/repositories/online-course-payment-attempt.repository'
import { OnlineCoursePaymentAttempt } from '../../../domain/entities/online-course-payment'
import { OnlinePaymentAttemptStatus, OnlinePaymentProvider } from '../../../shared/enums'
import { OnlineCoursePaymentMapper } from '../../mappers/payment'
import { PrismaService } from '../../../prisma/prisma.service'

export class PrismaOnlineCoursePaymentAttemptRepository implements IOnlineCoursePaymentAttemptRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateOnlineCoursePaymentAttemptData): Promise<OnlineCoursePaymentAttempt> {
    const created = await this.prisma.onlineCoursePaymentAttempt.create({
      data,
    })

    return OnlineCoursePaymentMapper.toDomainPaymentAttempt(created)!
  }

  async findById(attemptId: number): Promise<OnlineCoursePaymentAttempt | null> {
    const attempt = await this.prisma.onlineCoursePaymentAttempt.findUnique({
      where: { attemptId },
    })

    return OnlineCoursePaymentMapper.toDomainPaymentAttempt(attempt)
  }

  async findByAttemptCode(attemptCode: string): Promise<OnlineCoursePaymentAttempt | null> {
    const attempt = await this.prisma.onlineCoursePaymentAttempt.findUnique({
      where: { attemptCode },
    })

    return OnlineCoursePaymentMapper.toDomainPaymentAttempt(attempt)
  }

  async findByProviderOrder(
    provider: OnlinePaymentProvider,
    providerOrderId: string,
  ): Promise<OnlineCoursePaymentAttempt | null> {
    const attempt = await this.prisma.onlineCoursePaymentAttempt.findUnique({
      where: {
        provider_providerOrderId: {
          provider,
          providerOrderId,
        },
      },
    })

    return OnlineCoursePaymentMapper.toDomainPaymentAttempt(attempt)
  }

  async findSucceededByInvoice(invoiceId: number): Promise<OnlineCoursePaymentAttempt | null> {
    const attempt = await this.prisma.onlineCoursePaymentAttempt.findFirst({
      where: {
        invoiceId,
        status: OnlinePaymentAttemptStatus.SUCCEEDED,
      },
      orderBy: { paidAt: 'desc' },
    })

    return OnlineCoursePaymentMapper.toDomainPaymentAttempt(attempt)
  }

  async update(attemptId: number, data: UpdateOnlineCoursePaymentAttemptData): Promise<OnlineCoursePaymentAttempt> {
    const updated = await this.prisma.onlineCoursePaymentAttempt.update({
      where: { attemptId },
      data,
    })

    return OnlineCoursePaymentMapper.toDomainPaymentAttempt(updated)!
  }

  async markSucceeded(
    attemptId: number,
    data: MarkOnlinePaymentAttemptSucceededData,
  ): Promise<OnlineCoursePaymentAttempt> {
    return this.update(attemptId, {
      status: OnlinePaymentAttemptStatus.SUCCEEDED,
      providerTransactionId: data.providerTransactionId,
      providerResponseCode: data.providerResponseCode,
      providerMessage: data.providerMessage,
      providerBankCode: data.providerBankCode,
      providerBankTranNo: data.providerBankTranNo,
      providerCardType: data.providerCardType,
      providerPayDate: data.providerPayDate,
      callbackPayload: data.callbackPayload,
      paidAt: data.paidAt ?? new Date(),
    })
  }

  async markFailed(
    attemptId: number,
    responseCode?: string | null,
    message?: string | null,
    payload?: any,
  ): Promise<OnlineCoursePaymentAttempt> {
    return this.update(attemptId, {
      status: OnlinePaymentAttemptStatus.FAILED,
      providerResponseCode: responseCode,
      providerMessage: message,
      callbackPayload: payload,
      failedAt: new Date(),
    })
  }

  async markCanceled(attemptId: number, reason?: string | null): Promise<OnlineCoursePaymentAttempt> {
    return this.update(attemptId, {
      status: OnlinePaymentAttemptStatus.CANCELLED,
      canceledAt: new Date(),
      cancelReason: reason,
    })
  }

  async markExpired(attemptId: number): Promise<OnlineCoursePaymentAttempt> {
    return this.update(attemptId, {
      status: OnlinePaymentAttemptStatus.EXPIRED,
      expiredAt: new Date(),
    })
  }
}
