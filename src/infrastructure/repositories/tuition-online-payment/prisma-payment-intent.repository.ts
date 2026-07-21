import { Prisma } from '@prisma/client'

import { PaymentIntent } from '../../../domain/entities/tuition-online-payment'
import type {
  CreatePaymentIntentData,
  PaymentIntentListOptions,
  UpdatePaymentIntentData,
} from '../../../domain/interface/tuition-online-payment'
import type { IPaymentIntentRepository } from '../../../domain/repositories/payment-intent.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { PaymentIntentMapper } from '../../mappers/tuition-online-payment'

export class PrismaPaymentIntentRepository implements IPaymentIntentRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreatePaymentIntentData): Promise<PaymentIntent> {
    const created = await this.prisma.paymentIntent.create({
      data: {
        tuitionPaymentId: data.tuitionPaymentId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        expiresAt: data.expiresAt,
      },
    })

    return PaymentIntentMapper.toDomain(created)!
  }

  async findById(paymentIntentId: number): Promise<PaymentIntent | null> {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { paymentIntentId },
    })

    return PaymentIntentMapper.toDomain(paymentIntent)
  }

  async findByTuitionPaymentId(tuitionPaymentId: number): Promise<PaymentIntent | null> {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { tuitionPaymentId },
    })

    return PaymentIntentMapper.toDomain(paymentIntent)
  }

  async findAll(options?: PaymentIntentListOptions): Promise<PaymentIntent[]> {
    const paymentIntents = await this.prisma.paymentIntent.findMany({
      where: {
        ...(options?.status !== undefined && { status: options.status }),
        ...(options?.tuitionPaymentId !== undefined && { tuitionPaymentId: options.tuitionPaymentId }),
        ...(options?.expiresBefore !== undefined && { expiresAt: { lte: options.expiresBefore } }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ createdAt: 'desc' }, { paymentIntentId: 'desc' }],
    })

    return PaymentIntentMapper.toDomainList(paymentIntents)
  }

  async update(paymentIntentId: number, data: UpdatePaymentIntentData): Promise<PaymentIntent> {
    const updated = await this.prisma.paymentIntent.update({
      where: { paymentIntentId },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      },
    })

    return PaymentIntentMapper.toDomain(updated)!
  }

  async delete(paymentIntentId: number): Promise<boolean> {
    await this.prisma.paymentIntent.delete({
      where: { paymentIntentId },
    })

    return true
  }
}
