import { Prisma } from '@prisma/client'
import { BookSalesContactConfigurationEntity } from 'src/domain/entities'
import { IBookSalesContactConfigurationRepository } from 'src/domain/repositories'
import { PrismaService } from 'src/prisma/prisma.service'
import { BookSalesContactConfigurationMapper } from 'src/infrastructure/mappers'

type Prismaish = Prisma.TransactionClient | PrismaService

export class PrismaBookSalesContactConfigurationRepository implements IBookSalesContactConfigurationRepository {
  constructor(private readonly prisma: Prismaish) {}

  async findCurrent(): Promise<BookSalesContactConfigurationEntity | null> {
    const record = await this.prisma.bookSalesContactConfiguration.findUnique({ where: { scopeKey: 'GLOBAL' } })
    return record ? BookSalesContactConfigurationMapper.toDomain(record) : null
  }

  async upsertCurrent(data: { phone: string; facebookUrl: string }): Promise<BookSalesContactConfigurationEntity> {
    const record = await this.prisma.bookSalesContactConfiguration.upsert({
      where: { scopeKey: 'GLOBAL' },
      create: { scopeKey: 'GLOBAL', ...data },
      update: data,
    })
    return BookSalesContactConfigurationMapper.toDomain(record)
  }
}
