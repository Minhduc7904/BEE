import { Prisma } from '@prisma/client'
import { CoursePaymentConfiguration } from '../../../domain/entities/tuition-online-payment/course-payment-configuration.entity'
import type { ICoursePaymentConfigurationRepository } from '../../../domain/repositories/course-payment-configuration.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { CoursePaymentConfigurationMapper } from '../../mappers/tuition-online-payment/course-payment-configuration.mapper'

export class PrismaCoursePaymentConfigurationRepository implements ICoursePaymentConfigurationRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async findCurrent(): Promise<CoursePaymentConfiguration | null> {
    return CoursePaymentConfigurationMapper.toDomain(
      await this.prisma.coursePaymentConfiguration.findUnique({ where: { scopeKey: 'GLOBAL' } }),
    )
  }

  async upsert(receivingBankAccountId: number): Promise<CoursePaymentConfiguration> {
    const configuration = await this.prisma.coursePaymentConfiguration.upsert({
      where: { scopeKey: 'GLOBAL' },
      create: { scopeKey: 'GLOBAL', receivingBankAccountId },
      update: { receivingBankAccountId },
    })
    return CoursePaymentConfigurationMapper.toDomain(configuration)!
  }
}
