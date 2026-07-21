import { Prisma } from '@prisma/client'

import { ReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'
import type {
  CreateReceivingBankAccountData,
  ReceivingBankAccountListOptions,
  UpdateReceivingBankAccountData,
} from '../../../domain/interface/tuition-online-payment'
import type { IReceivingBankAccountRepository } from '../../../domain/repositories/receiving-bank-account.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { ReceivingBankAccountMapper } from '../../mappers/tuition-online-payment'

export class PrismaReceivingBankAccountRepository implements IReceivingBankAccountRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateReceivingBankAccountData): Promise<ReceivingBankAccount> {
    const created = await this.prisma.receivingBankAccount.create({
      data: {
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountHolder: data.accountHolder,
        displayName: data.displayName,
        status: data.status,
        sepayBankAccountId: data.sepayBankAccountId,
        sepayStatus: data.sepayStatus,
        notes: data.notes,
      },
    })

    return ReceivingBankAccountMapper.toDomain(created)!
  }

  async findById(receivingBankAccountId: number): Promise<ReceivingBankAccount | null> {
    const account = await this.prisma.receivingBankAccount.findUnique({
      where: { receivingBankAccountId },
    })

    return ReceivingBankAccountMapper.toDomain(account)
  }

  async findByBankAndAccountNumber(bankCode: string, accountNumber: string): Promise<ReceivingBankAccount | null> {
    const account = await this.prisma.receivingBankAccount.findUnique({
      where: {
        bankCode_accountNumber: {
          bankCode,
          accountNumber,
        },
      },
    })

    return ReceivingBankAccountMapper.toDomain(account)
  }

  async findAllByAccountNumber(accountNumber: string): Promise<ReceivingBankAccount[]> {
    const accounts = await this.prisma.receivingBankAccount.findMany({
      where: { accountNumber },
      orderBy: { receivingBankAccountId: 'asc' },
    })

    return ReceivingBankAccountMapper.toDomainList(accounts)
  }

  async findAllBySepayBankAccountId(sepayBankAccountId: string): Promise<ReceivingBankAccount[]> {
    const accounts = await this.prisma.receivingBankAccount.findMany({
      where: { sepayBankAccountId },
      orderBy: { receivingBankAccountId: 'asc' },
    })

    return ReceivingBankAccountMapper.toDomainList(accounts)
  }

  async findAll(options?: ReceivingBankAccountListOptions): Promise<ReceivingBankAccount[]> {
    const accounts = await this.prisma.receivingBankAccount.findMany({
      where: this.buildWhere(options),
      skip: options?.skip,
      take: options?.take,
      orderBy: this.buildOrderBy(options),
    })

    return ReceivingBankAccountMapper.toDomainList(accounts)
  }

  async count(options?: ReceivingBankAccountListOptions): Promise<number> {
    return this.prisma.receivingBankAccount.count({
      where: this.buildWhere(options),
    })
  }

  async update(receivingBankAccountId: number, data: UpdateReceivingBankAccountData): Promise<ReceivingBankAccount> {
    const updated = await this.prisma.receivingBankAccount.update({
      where: { receivingBankAccountId },
      data: {
        ...(data.bankCode !== undefined && { bankCode: data.bankCode }),
        ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
        ...(data.accountHolder !== undefined && { accountHolder: data.accountHolder }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.sepayBankAccountId !== undefined && { sepayBankAccountId: data.sepayBankAccountId }),
        ...(data.sepayStatus !== undefined && { sepayStatus: data.sepayStatus }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    })

    return ReceivingBankAccountMapper.toDomain(updated)!
  }

  private buildWhere(options?: ReceivingBankAccountListOptions): Prisma.ReceivingBankAccountWhereInput {
    const where: Prisma.ReceivingBankAccountWhereInput = {
      ...(options?.status !== undefined && { status: options.status }),
      ...(options?.bankCode !== undefined && { bankCode: options.bankCode }),
    }

    if (options?.search) {
      where.OR = [
        { accountHolder: { contains: options.search } },
        { displayName: { contains: options.search } },
        { accountNumber: { contains: options.search } },
      ]
    }

    return where
  }

  private buildOrderBy(
    options?: ReceivingBankAccountListOptions,
  ): Prisma.ReceivingBankAccountOrderByWithRelationInput[] {
    const allowedSortFields = [
      'receivingBankAccountId',
      'bankCode',
      'accountHolder',
      'displayName',
      'status',
      'createdAt',
      'updatedAt',
    ] as const
    const sortBy: NonNullable<ReceivingBankAccountListOptions['sortBy']> = allowedSortFields.includes(
      options?.sortBy as (typeof allowedSortFields)[number],
    )
      ? (options?.sortBy as NonNullable<ReceivingBankAccountListOptions['sortBy']>)
      : 'createdAt'
    const sortOrder = options?.sortOrder ?? 'desc'

    return [{ [sortBy]: sortOrder }, { receivingBankAccountId: 'desc' }]
  }
}
