import { Prisma } from '@prisma/client'

import { TuitionGradeReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'
import type {
  CreateTuitionGradeReceivingBankAccountData,
  TuitionGradeReceivingBankAccountListOptions,
  UpdateTuitionGradeReceivingBankAccountData,
} from '../../../domain/interface/tuition-online-payment'
import type { ITuitionGradeReceivingBankAccountRepository } from '../../../domain/repositories/tuition-grade-receiving-bank-account.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { TuitionGradeReceivingBankAccountMapper } from '../../mappers/tuition-online-payment'

export class PrismaTuitionGradeReceivingBankAccountRepository implements ITuitionGradeReceivingBankAccountRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(
    data: CreateTuitionGradeReceivingBankAccountData,
  ): Promise<TuitionGradeReceivingBankAccount> {
    const created = await this.prisma.tuitionGradeReceivingBankAccount.create({ data })

    return TuitionGradeReceivingBankAccountMapper.toDomain(created)!
  }

  async findById(
    tuitionGradeReceivingBankAccountId: number,
  ): Promise<TuitionGradeReceivingBankAccount | null> {
    const mapping = await this.prisma.tuitionGradeReceivingBankAccount.findUnique({
      where: { tuitionGradeReceivingBankAccountId },
    })

    return TuitionGradeReceivingBankAccountMapper.toDomain(mapping)
  }

  async findByGrade(grade: number): Promise<TuitionGradeReceivingBankAccount | null> {
    const mapping = await this.prisma.tuitionGradeReceivingBankAccount.findUnique({
      where: { grade },
    })

    return TuitionGradeReceivingBankAccountMapper.toDomain(mapping)
  }

  async findAll(
    options?: TuitionGradeReceivingBankAccountListOptions,
  ): Promise<TuitionGradeReceivingBankAccount[]> {
    const mappings = await this.prisma.tuitionGradeReceivingBankAccount.findMany({
      where: {
        ...(options?.receivingBankAccountId !== undefined && {
          receivingBankAccountId: options.receivingBankAccountId,
        }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ grade: 'asc' }, { tuitionGradeReceivingBankAccountId: 'asc' }],
    })

    return TuitionGradeReceivingBankAccountMapper.toDomainList(mappings)
  }

  async update(
    tuitionGradeReceivingBankAccountId: number,
    data: UpdateTuitionGradeReceivingBankAccountData,
  ): Promise<TuitionGradeReceivingBankAccount> {
    const updated = await this.prisma.tuitionGradeReceivingBankAccount.update({
      where: { tuitionGradeReceivingBankAccountId },
      data: { receivingBankAccountId: data.receivingBankAccountId },
    })

    return TuitionGradeReceivingBankAccountMapper.toDomain(updated)!
  }

  async delete(tuitionGradeReceivingBankAccountId: number): Promise<void> {
    await this.prisma.tuitionGradeReceivingBankAccount.delete({
      where: { tuitionGradeReceivingBankAccountId },
    })
  }
}
