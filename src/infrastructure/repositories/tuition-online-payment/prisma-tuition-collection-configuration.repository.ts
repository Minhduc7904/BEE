import { Prisma } from '@prisma/client'

import { TuitionCollectionConfiguration } from '../../../domain/entities/tuition-online-payment'
import type {
  CreateTuitionCollectionConfigurationData,
  UpdateTuitionCollectionConfigurationData,
} from '../../../domain/interface/tuition-online-payment'
import type { ITuitionCollectionConfigurationRepository } from '../../../domain/repositories/tuition-collection-configuration.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { TuitionCollectionConfigurationMapper } from '../../mappers/tuition-online-payment'

export class PrismaTuitionCollectionConfigurationRepository implements ITuitionCollectionConfigurationRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(
    data: CreateTuitionCollectionConfigurationData,
  ): Promise<TuitionCollectionConfiguration> {
    const created = await this.prisma.tuitionCollectionConfiguration.create({
      data: {
        collectionMode: data.collectionMode,
        defaultManualReceivingBankAccountId: data.defaultManualReceivingBankAccountId,
      },
    })

    return TuitionCollectionConfigurationMapper.toDomain(created)!
  }

  async findById(
    tuitionCollectionConfigurationId: number,
  ): Promise<TuitionCollectionConfiguration | null> {
    const configuration = await this.prisma.tuitionCollectionConfiguration.findUnique({
      where: { tuitionCollectionConfigurationId },
    })

    return TuitionCollectionConfigurationMapper.toDomain(configuration)
  }

  async findCurrent(): Promise<TuitionCollectionConfiguration | null> {
    const configuration = await this.prisma.tuitionCollectionConfiguration.findFirst({
      orderBy: { tuitionCollectionConfigurationId: 'asc' },
    })

    return TuitionCollectionConfigurationMapper.toDomain(configuration)
  }

  async update(
    tuitionCollectionConfigurationId: number,
    data: UpdateTuitionCollectionConfigurationData,
  ): Promise<TuitionCollectionConfiguration> {
    const updated = await this.prisma.tuitionCollectionConfiguration.update({
      where: { tuitionCollectionConfigurationId },
      data: {
        ...(data.collectionMode !== undefined && { collectionMode: data.collectionMode }),
        ...(data.defaultManualReceivingBankAccountId !== undefined && {
          defaultManualReceivingBankAccountId: data.defaultManualReceivingBankAccountId,
        }),
      },
    })

    return TuitionCollectionConfigurationMapper.toDomain(updated)!
  }
}
