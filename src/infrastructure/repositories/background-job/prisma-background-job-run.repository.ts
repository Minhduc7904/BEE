import { Prisma } from '@prisma/client'

import { BackgroundJobRun } from '../../../domain/entities/background-job'
import type {
  BackgroundJobRunListOptions,
  CreateBackgroundJobRunData,
  UpdateBackgroundJobRunData,
} from '../../../domain/interface/background-job'
import type { IBackgroundJobRunRepository } from '../../../domain/repositories/background-job-run.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { BackgroundJobRunMapper } from '../../mappers/background-job'

export class PrismaBackgroundJobRunRepository implements IBackgroundJobRunRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateBackgroundJobRunData): Promise<BackgroundJobRun> {
    const created = await this.prisma.backgroundJobRun.create({
      data: {
        backgroundJobId: data.backgroundJobId,
        scheduledAt: data.scheduledAt,
        startedAt: data.startedAt,
        status: data.status,
        workerId: data.workerId,
        lockToken: data.lockToken,
        leaseExpiresAt: data.leaseExpiresAt,
        retryCount: data.retryCount,
        finishedAt: data.finishedAt,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        resultSummary: this.toPrismaJson(data.resultSummary),
      },
    })
    return BackgroundJobRunMapper.toDomain(created)!
  }

  async findById(backgroundJobRunId: number): Promise<BackgroundJobRun | null> {
    const run = await this.prisma.backgroundJobRun.findUnique({ where: { backgroundJobRunId } })
    return BackgroundJobRunMapper.toDomain(run)
  }

  async findAll(options: BackgroundJobRunListOptions): Promise<{ data: BackgroundJobRun[]; total: number }> {
    const where: Prisma.BackgroundJobRunWhereInput = {
      ...(options.backgroundJobId !== undefined && { backgroundJobId: options.backgroundJobId }),
      ...(options.status !== undefined && { status: options.status }),
      ...(options.workerId && { workerId: { contains: options.workerId } }),
      ...((options.fromScheduledAt || options.toScheduledAt) && {
        scheduledAt: {
          ...(options.fromScheduledAt && { gte: options.fromScheduledAt }),
          ...(options.toScheduledAt && { lte: options.toScheduledAt }),
        },
      }),
    }
    const [runs, total] = await Promise.all([
      this.prisma.backgroundJobRun.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { [options.sortBy ?? 'scheduledAt']: options.sortOrder ?? 'desc' },
      }),
      this.prisma.backgroundJobRun.count({ where }),
    ])
    return { data: BackgroundJobRunMapper.toDomainList(runs), total }
  }

  async findByBackgroundJobAndScheduledAt(
    backgroundJobId: number,
    scheduledAt: Date,
  ): Promise<BackgroundJobRun | null> {
    const run = await this.prisma.backgroundJobRun.findUnique({
      where: { backgroundJobId_scheduledAt: { backgroundJobId, scheduledAt } },
    })
    return BackgroundJobRunMapper.toDomain(run)
  }

  async findLatestByBackgroundJobId(backgroundJobId: number): Promise<BackgroundJobRun | null> {
    const run = await this.prisma.backgroundJobRun.findFirst({
      where: { backgroundJobId },
      orderBy: [{ scheduledAt: 'desc' }, { backgroundJobRunId: 'desc' }],
    })
    return BackgroundJobRunMapper.toDomain(run)
  }

  async update(backgroundJobRunId: number, data: UpdateBackgroundJobRunData): Promise<BackgroundJobRun> {
    const updated = await this.prisma.backgroundJobRun.update({
      where: { backgroundJobRunId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.leaseExpiresAt !== undefined && { leaseExpiresAt: data.leaseExpiresAt }),
        ...(data.retryCount !== undefined && { retryCount: data.retryCount }),
        ...(data.finishedAt !== undefined && { finishedAt: data.finishedAt }),
        ...(data.errorCode !== undefined && { errorCode: data.errorCode }),
        ...(data.errorMessage !== undefined && { errorMessage: data.errorMessage }),
        ...(data.resultSummary !== undefined && { resultSummary: this.toPrismaJson(data.resultSummary) }),
      },
    })
    return BackgroundJobRunMapper.toDomain(updated)!
  }

  private toPrismaJson(
    resultSummary: CreateBackgroundJobRunData['resultSummary'] | UpdateBackgroundJobRunData['resultSummary'],
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (resultSummary === undefined) return undefined
    if (resultSummary === null) return Prisma.JsonNull
    return resultSummary as Prisma.InputJsonValue
  }
}
