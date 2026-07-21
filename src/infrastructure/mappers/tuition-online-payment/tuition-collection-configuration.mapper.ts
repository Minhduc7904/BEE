import type { TuitionCollectionConfiguration as PrismaTuitionCollectionConfiguration } from '@prisma/client'

import { TuitionCollectionConfiguration } from '../../../domain/entities/tuition-online-payment'
import { TuitionCollectionMode } from '../../../shared/enums'

export class TuitionCollectionConfigurationMapper {
  static toDomain(
    prismaConfiguration: PrismaTuitionCollectionConfiguration | null | undefined,
  ): TuitionCollectionConfiguration | null {
    if (!prismaConfiguration) return null

    return new TuitionCollectionConfiguration({
      tuitionCollectionConfigurationId: prismaConfiguration.tuitionCollectionConfigurationId,
      collectionMode: prismaConfiguration.collectionMode as TuitionCollectionMode,
      defaultManualReceivingBankAccountId: prismaConfiguration.defaultManualReceivingBankAccountId,
      createdAt: prismaConfiguration.createdAt,
      updatedAt: prismaConfiguration.updatedAt,
    })
  }
}
