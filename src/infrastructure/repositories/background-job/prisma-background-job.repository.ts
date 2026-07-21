import { Prisma } from '@prisma/client'

import { BackgroundJob } from '../../../domain/entities/background-job'
import type {
  BackgroundJobListOptions,
  CreateBackgroundJobData,
  UpdateBackgroundJobData,
} from '../../../domain/interface/background-job'
import type { IBackgroundJobRepository } from '../../../domain/repositories/background-job.repository'
import { BackgroundJobCode } from '../../../shared/enums'
import { PrismaService } from '../../../prisma/prisma.service'
import { BackgroundJobMapper } from '../../mappers/background-job'

export class PrismaBackgroundJobRepository implements IBackgroundJobRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateBackgroundJobData): Promise<BackgroundJob> {
    const created = await this.prisma.backgroundJob.create({
      data: {
        code: data.code,
        displayName: data.displayName,
        cronExpression: data.cronExpression,
        timezone: data.timezone,
        isEnabled: data.isEnabled,
        maxRuntimeSeconds: data.maxRuntimeSeconds,
      },
    })

    return BackgroundJobMapper.toDomain(created)!
  }

  async upsert(data: CreateBackgroundJobData): Promise<BackgroundJob> {
    const job = await this.prisma.backgroundJob.upsert({
      where: { code: data.code },
      create: {
        code: data.code,
        displayName: data.displayName,
        cronExpression: data.cronExpression,
        timezone: data.timezone,
        isEnabled: data.isEnabled,
        maxRuntimeSeconds: data.maxRuntimeSeconds,
      },
      update: {},
    })
    return BackgroundJobMapper.toDomain(job)!
  }

  async findById(backgroundJobId: number): Promise<BackgroundJob | null> {
    const job = await this.prisma.backgroundJob.findUnique({ where: { backgroundJobId } })
    return BackgroundJobMapper.toDomain(job)
  }

  async findByCode(code: BackgroundJobCode): Promise<BackgroundJob | null> {
    const job = await this.prisma.backgroundJob.findUnique({ where: { code } })
    return BackgroundJobMapper.toDomain(job)
  }

  async findAll(options: BackgroundJobListOptions): Promise<{ data: BackgroundJob[]; total: number }> {
    const where: Prisma.BackgroundJobWhereInput = {
      ...(options.code !== undefined && { code: options.code }),
      ...(options.isEnabled !== undefined && { isEnabled: options.isEnabled }),
      ...(options.search && { displayName: { contains: options.search } }),
    }
    const [jobs, total] = await Promise.all([
      this.prisma.backgroundJob.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { [options.sortBy ?? 'backgroundJobId']: options.sortOrder ?? 'asc' },
      }),
      this.prisma.backgroundJob.count({ where }),
    ])
    return { data: BackgroundJobMapper.toDomainList(jobs), total }
  }

  async findAllEnabled(): Promise<BackgroundJob[]> {
    const jobs = await this.prisma.backgroundJob.findMany({
      where: { isEnabled: true },
      orderBy: { backgroundJobId: 'asc' },
    })
    return BackgroundJobMapper.toDomainList(jobs)
  }

  async update(backgroundJobId: number, data: UpdateBackgroundJobData): Promise<BackgroundJob> {
    const updated = await this.prisma.backgroundJob.update({
      where: { backgroundJobId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.cronExpression !== undefined && { cronExpression: data.cronExpression }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
        ...(data.maxRuntimeSeconds !== undefined && { maxRuntimeSeconds: data.maxRuntimeSeconds }),
      },
    })
    return BackgroundJobMapper.toDomain(updated)!
  }
}
