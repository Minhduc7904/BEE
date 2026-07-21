import { Prisma } from '@prisma/client'

import { PaymentAttempt } from '../../../domain/entities/tuition-online-payment'
import type {
  CreatePaymentAttemptData,
  PaymentAttemptListOptions,
  UpdatePaymentAttemptData,
} from '../../../domain/interface/tuition-online-payment'
import type { IPaymentAttemptRepository } from '../../../domain/repositories/payment-attempt.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { PaymentAttemptMapper } from '../../mappers/tuition-online-payment'
import { PaymentAttemptStatus } from '../../../shared/enums'

export class PrismaPaymentAttemptRepository implements IPaymentAttemptRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreatePaymentAttemptData): Promise<PaymentAttempt> {
    const created = await this.prisma.paymentAttempt.create({
      data: {
        paymentIntentId: data.paymentIntentId,
        attemptCode: data.attemptCode,
        receivingBankAccountId: data.receivingBankAccountId,
        amount: data.amount,
        currency: data.currency,
        bankSelectionSource: data.bankSelectionSource,
        confirmationMode: data.confirmationMode,
        status: data.status,
        qrCodeUrl: data.qrCodeUrl,
        expiresAt: data.expiresAt,
      },
    })

    return PaymentAttemptMapper.toDomain(created)!
  }

  async findById(paymentAttemptId: number): Promise<PaymentAttempt | null> {
    const paymentAttempt = await this.prisma.paymentAttempt.findUnique({
      where: { paymentAttemptId },
    })

    return PaymentAttemptMapper.toDomain(paymentAttempt)
  }

  async findByAttemptCode(attemptCode: string): Promise<PaymentAttempt | null> {
    const paymentAttempt = await this.prisma.paymentAttempt.findUnique({
      where: { attemptCode },
    })

    return PaymentAttemptMapper.toDomain(paymentAttempt)
  }

  async findLatestPendingByPaymentIntent(paymentIntentId: number): Promise<PaymentAttempt | null> {
    const paymentAttempt = await this.prisma.paymentAttempt.findFirst({
      where: {
        paymentIntentId,
        status: PaymentAttemptStatus.PENDING,
      },
      orderBy: [{ createdAt: 'desc' }, { paymentAttemptId: 'desc' }],
    })

    return PaymentAttemptMapper.toDomain(paymentAttempt)
  }

  async findAll(options?: PaymentAttemptListOptions): Promise<PaymentAttempt[]> {
    const paymentAttempts = await this.prisma.paymentAttempt.findMany({
      where: {
        ...(options?.paymentIntentId !== undefined && { paymentIntentId: options.paymentIntentId }),
        ...(options?.receivingBankAccountId !== undefined && {
          receivingBankAccountId: options.receivingBankAccountId,
        }),
        ...(options?.status !== undefined && { status: options.status }),
        ...(options?.confirmationMode !== undefined && { confirmationMode: options.confirmationMode }),
        ...(options?.expiresBefore !== undefined && { expiresAt: { lte: options.expiresBefore } }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ createdAt: 'desc' }, { paymentAttemptId: 'desc' }],
    })

    return PaymentAttemptMapper.toDomainList(paymentAttempts)
  }

  async update(paymentAttemptId: number, data: UpdatePaymentAttemptData): Promise<PaymentAttempt> {
    const updated = await this.prisma.paymentAttempt.update({
      where: { paymentAttemptId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.qrCodeUrl !== undefined && { qrCodeUrl: data.qrCodeUrl }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      },
    })

    return PaymentAttemptMapper.toDomain(updated)!
  }

  async deleteByPaymentIntentId(paymentIntentId: number): Promise<number> {
    const { count } = await this.prisma.paymentAttempt.deleteMany({
      where: { paymentIntentId },
    })

    return count
  }
}
