import type { ReceivingBankAccount as PrismaReceivingBankAccount } from '@prisma/client'

import { ReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'
import { ReceivingBankAccountStatus, SepayBankAccountStatus } from '../../../shared/enums'

export class ReceivingBankAccountMapper {
  static toDomain(
    prismaReceivingBankAccount: PrismaReceivingBankAccount | null | undefined,
  ): ReceivingBankAccount | null {
    if (!prismaReceivingBankAccount) return null

    return new ReceivingBankAccount({
      receivingBankAccountId: prismaReceivingBankAccount.receivingBankAccountId,
      bankCode: prismaReceivingBankAccount.bankCode,
      accountNumber: prismaReceivingBankAccount.accountNumber,
      accountHolder: prismaReceivingBankAccount.accountHolder,
      displayName: prismaReceivingBankAccount.displayName,
      status: prismaReceivingBankAccount.status as ReceivingBankAccountStatus,
      sepayBankAccountId: prismaReceivingBankAccount.sepayBankAccountId,
      sepayStatus: prismaReceivingBankAccount.sepayStatus as SepayBankAccountStatus,
      notes: prismaReceivingBankAccount.notes,
      createdAt: prismaReceivingBankAccount.createdAt,
      updatedAt: prismaReceivingBankAccount.updatedAt,
    })
  }

  static toDomainList(
    prismaReceivingBankAccounts: PrismaReceivingBankAccount[] | null | undefined,
  ): ReceivingBankAccount[] {
    if (!prismaReceivingBankAccounts?.length) return []

    return prismaReceivingBankAccounts
      .map((item) => this.toDomain(item))
      .filter((item): item is ReceivingBankAccount => item !== null)
  }
}
