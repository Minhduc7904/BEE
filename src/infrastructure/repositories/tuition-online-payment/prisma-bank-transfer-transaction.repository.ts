import { Prisma } from '@prisma/client'

import { BankTransferTransaction } from '../../../domain/entities/tuition-online-payment'
import type {
  BankTransferTransactionListOptions,
  BankTransferTransactionProviderReferenceMatchOptions,
  BankTransferTransactionStatistics,
  CreateBankTransferTransactionData,
  JsonPayload,
  UpdateBankTransferTransactionReconciliationData,
} from '../../../domain/interface/tuition-online-payment'
import type { IBankTransferTransactionRepository } from '../../../domain/repositories/bank-transfer-transaction.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { BankTransferTransactionMapper } from '../../mappers/tuition-online-payment'
import { BankTransferProvider, BankTransferReconciliationStatus } from '../../../shared/enums'

export class PrismaBankTransferTransactionRepository implements IBankTransferTransactionRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateBankTransferTransactionData): Promise<BankTransferTransaction> {
    const created = await this.prisma.bankTransferTransaction.create({
      data: {
        provider: data.provider,
        providerTransactionId: data.providerTransactionId,
        sepayV2TransactionId: data.sepayV2TransactionId,
        paymentAttemptId: data.paymentAttemptId,
        receivingBankAccountId: data.receivingBankAccountId,
        amount: data.amount,
        transactionAt: data.transactionAt,
        receivingAccountNumber: data.receivingAccountNumber,
        content: data.content,
        reference: data.reference,
        ...(data.rawPayload !== undefined && { rawPayload: this.toPrismaJsonValue(data.rawPayload) }),
        processingStatus: data.processingStatus,
        reconciliationStatus: data.reconciliationStatus,
      },
    })

    return BankTransferTransactionMapper.toDomain(created)!
  }

  async findById(bankTransferTransactionId: number): Promise<BankTransferTransaction | null> {
    const transaction = await this.prisma.bankTransferTransaction.findUnique({
      where: { bankTransferTransactionId },
    })

    return BankTransferTransactionMapper.toDomain(transaction)
  }

  async findByProviderTransactionId(
    provider: BankTransferProvider,
    providerTransactionId: string,
  ): Promise<BankTransferTransaction | null> {
    const transaction = await this.prisma.bankTransferTransaction.findUnique({
      where: {
        provider_providerTransactionId: {
          provider,
          providerTransactionId,
        },
      },
    })

    return BankTransferTransactionMapper.toDomain(transaction)
  }

  async findBySepayV2TransactionId(sepayV2TransactionId: string): Promise<BankTransferTransaction | null> {
    const transaction = await this.prisma.bankTransferTransaction.findUnique({
      where: { sepayV2TransactionId },
    })
    return BankTransferTransactionMapper.toDomain(transaction)
  }

  async findAllByProviderReferenceAndMatchCriteria(
    options: BankTransferTransactionProviderReferenceMatchOptions,
  ): Promise<BankTransferTransaction[]> {
    const transactions = await this.prisma.bankTransferTransaction.findMany({
      where: {
        provider: options.provider,
        reference: options.reference,
        amount: options.amount,
        receivingAccountNumber: options.receivingAccountNumber,
      },
      orderBy: { bankTransferTransactionId: 'asc' },
    })
    return BankTransferTransactionMapper.toDomainList(transactions)
  }

  async findAll(options?: BankTransferTransactionListOptions): Promise<BankTransferTransaction[]> {
    const transactions = await this.prisma.bankTransferTransaction.findMany({
      where: this.buildWhere(options),
      skip: options?.skip,
      take: options?.take,
      orderBy: this.buildOrderBy(options),
      include: this.buildInclude(options),
    })

    return BankTransferTransactionMapper.toDomainList(transactions)
  }

  async count(options?: BankTransferTransactionListOptions): Promise<number> {
    return this.prisma.bankTransferTransaction.count({ where: this.buildWhere(options) })
  }

  async getStatistics(options?: BankTransferTransactionListOptions): Promise<BankTransferTransactionStatistics> {
    const where = this.buildWhere(options, false)
    const [
      totalTransactions,
      amountAggregate,
      unreconciledTransactions,
      automaticReconciledTransactions,
      adminReconciledTransactions,
    ] = await Promise.all([
      this.prisma.bankTransferTransaction.count({ where }),
      this.prisma.bankTransferTransaction.aggregate({ where, _sum: { amount: true } }),
      this.prisma.bankTransferTransaction.count({
        where: { ...where, reconciliationStatus: BankTransferReconciliationStatus.UNRECONCILED },
      }),
      this.prisma.bankTransferTransaction.count({
        where: { ...where, reconciliationStatus: BankTransferReconciliationStatus.AUTOMATIC },
      }),
      this.prisma.bankTransferTransaction.count({
        where: { ...where, reconciliationStatus: BankTransferReconciliationStatus.ADMIN },
      }),
    ])

    return {
      totalTransactions,
      unreconciledTransactions,
      automaticReconciledTransactions,
      adminReconciledTransactions,
      totalAmount: amountAggregate._sum.amount ?? 0,
    }
  }

  async updateReconciliation(
    bankTransferTransactionId: number,
    data: UpdateBankTransferTransactionReconciliationData,
  ): Promise<BankTransferTransaction> {
    const updated = await this.prisma.bankTransferTransaction.update({
      where: { bankTransferTransactionId },
      data: {
        ...(data.paymentAttemptId !== undefined && { paymentAttemptId: data.paymentAttemptId }),
        ...(data.processingStatus !== undefined && { processingStatus: data.processingStatus }),
        ...(data.reconciliationStatus !== undefined && {
          reconciliationStatus: data.reconciliationStatus,
        }),
      },
    })

    return BankTransferTransactionMapper.toDomain(updated)!
  }

  async updateReceivingBankAccountId(
    bankTransferTransactionId: number,
    receivingBankAccountId: number,
  ): Promise<BankTransferTransaction> {
    const updated = await this.prisma.bankTransferTransaction.update({
      where: { bankTransferTransactionId },
      data: { receivingBankAccountId },
    })

    return BankTransferTransactionMapper.toDomain(updated)!
  }

  async updateSepayV2TransactionId(
    bankTransferTransactionId: number,
    sepayV2TransactionId: string,
  ): Promise<BankTransferTransaction> {
    const updated = await this.prisma.bankTransferTransaction.update({
      where: { bankTransferTransactionId },
      data: { sepayV2TransactionId },
    })
    return BankTransferTransactionMapper.toDomain(updated)!
  }

  private buildWhere(
    options?: BankTransferTransactionListOptions,
    includeReconciliationStatus = true,
  ): Prisma.BankTransferTransactionWhereInput {
    const where: Prisma.BankTransferTransactionWhereInput = {
      ...(options?.provider !== undefined && { provider: options.provider }),
      ...(options?.paymentAttemptId !== undefined && { paymentAttemptId: options.paymentAttemptId }),
      ...(options?.paymentAttemptIds?.length && { paymentAttemptId: { in: options.paymentAttemptIds } }),
      ...(options?.receivingBankAccountId !== undefined && {
        receivingBankAccountId: options.receivingBankAccountId,
      }),
      ...(options?.processingStatus !== undefined && { processingStatus: options.processingStatus }),
      ...(includeReconciliationStatus &&
        options?.reconciliationStatus !== undefined && {
          reconciliationStatus: options.reconciliationStatus,
        }),
      ...(options?.providerTransactionId !== undefined && {
        providerTransactionId: { contains: options.providerTransactionId },
      }),
      ...(options?.receivingAccountNumber !== undefined && {
        receivingAccountNumber: { contains: options.receivingAccountNumber },
      }),
    }

    const searchConditions: Prisma.BankTransferTransactionWhereInput[] = []
    if (options?.search) {
      searchConditions.push(
        { providerTransactionId: { contains: options.search } },
        { receivingAccountNumber: { contains: options.search } },
        { content: { contains: options.search } },
        { reference: { contains: options.search } },
      )
    }

    const paymentAttemptConditions: Prisma.BankTransferTransactionWhereInput[] = []
    if (options?.paymentAttemptIdsOrUnassigned !== undefined) {
      paymentAttemptConditions.push(
        ...(options.paymentAttemptIdsOrUnassigned.length > 0
          ? [{ paymentAttemptId: { in: options.paymentAttemptIdsOrUnassigned } }]
          : []),
        { paymentAttemptId: null },
      )
    }

    const orGroups = [searchConditions, paymentAttemptConditions].filter((conditions) => conditions.length > 0)
    if (orGroups.length === 1) {
      where.OR = orGroups[0]
    } else if (orGroups.length > 1) {
      where.AND = orGroups.map((conditions) => ({ OR: conditions }))
    }

    if (options?.minAmount !== undefined || options?.maxAmount !== undefined) {
      where.amount = {
        ...(options?.minAmount !== undefined && { gte: options.minAmount }),
        ...(options?.maxAmount !== undefined && { lte: options.maxAmount }),
      }
    }

    if (options?.fromTransactionAt !== undefined || options?.toTransactionAt !== undefined) {
      where.transactionAt = {
        ...(options?.fromTransactionAt !== undefined && { gte: options.fromTransactionAt }),
        ...(options?.toTransactionAt !== undefined && { lte: options.toTransactionAt }),
      }
    }

    return where
  }

  private buildInclude(
    options?: BankTransferTransactionListOptions,
  ): Prisma.BankTransferTransactionInclude | undefined {
    if (!options?.includeReceivingBankAccount) return undefined

    return { receivingBankAccount: true }
  }

  private buildOrderBy(
    options?: BankTransferTransactionListOptions,
  ): Prisma.BankTransferTransactionOrderByWithRelationInput[] {
    const sortBy = options?.sortBy ?? 'transactionAt'
    const sortOrder = options?.sortOrder ?? 'desc'

    return sortBy === 'bankTransferTransactionId'
      ? [{ bankTransferTransactionId: sortOrder }]
      : [{ [sortBy]: sortOrder }, { bankTransferTransactionId: 'desc' }]
  }

  private toPrismaJsonValue(payload: JsonPayload): Prisma.InputJsonValue {
    if (Array.isArray(payload)) {
      return payload.map((item) => this.toPrismaJsonValue(item))
    }

    if (typeof payload === 'object') {
      const result: { [key: string]: Prisma.InputJsonValue | null } = {}

      for (const [key, value] of Object.entries(payload)) {
        result[key] = value === null ? null : this.toPrismaJsonValue(value)
      }

      return result
    }

    return payload
  }
}
