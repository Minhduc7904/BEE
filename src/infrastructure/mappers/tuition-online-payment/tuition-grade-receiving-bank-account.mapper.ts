import type { TuitionGradeReceivingBankAccount as PrismaTuitionGradeReceivingBankAccount } from '@prisma/client'

import { TuitionGradeReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'

export class TuitionGradeReceivingBankAccountMapper {
  static toDomain(
    prismaMapping: PrismaTuitionGradeReceivingBankAccount | null | undefined,
  ): TuitionGradeReceivingBankAccount | null {
    if (!prismaMapping) return null

    return new TuitionGradeReceivingBankAccount({
      tuitionGradeReceivingBankAccountId: prismaMapping.tuitionGradeReceivingBankAccountId,
      grade: prismaMapping.grade,
      receivingBankAccountId: prismaMapping.receivingBankAccountId,
      createdAt: prismaMapping.createdAt,
      updatedAt: prismaMapping.updatedAt,
    })
  }

  static toDomainList(
    prismaMappings: PrismaTuitionGradeReceivingBankAccount[] | null | undefined,
  ): TuitionGradeReceivingBankAccount[] {
    if (!prismaMappings?.length) return []

    return prismaMappings
      .map((item) => this.toDomain(item))
      .filter((item): item is TuitionGradeReceivingBankAccount => item !== null)
  }
}
