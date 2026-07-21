import type { BackgroundJobRun as PrismaBackgroundJobRun } from '@prisma/client'

import { BackgroundJobRun } from '../../../domain/entities/background-job'
import type { BackgroundJobRunResultSummary } from '../../../domain/interface/background-job'
import { BackgroundJobRunStatus } from '../../../shared/enums'

export class BackgroundJobRunMapper {
  static toDomain(prismaBackgroundJobRun: PrismaBackgroundJobRun | null | undefined): BackgroundJobRun | null {
    if (!prismaBackgroundJobRun) return null

    return new BackgroundJobRun({
      backgroundJobRunId: prismaBackgroundJobRun.backgroundJobRunId,
      backgroundJobId: prismaBackgroundJobRun.backgroundJobId,
      scheduledAt: prismaBackgroundJobRun.scheduledAt,
      startedAt: prismaBackgroundJobRun.startedAt,
      status: prismaBackgroundJobRun.status as BackgroundJobRunStatus,
      workerId: prismaBackgroundJobRun.workerId,
      lockToken: prismaBackgroundJobRun.lockToken,
      leaseExpiresAt: prismaBackgroundJobRun.leaseExpiresAt,
      retryCount: prismaBackgroundJobRun.retryCount,
      finishedAt: prismaBackgroundJobRun.finishedAt,
      errorCode: prismaBackgroundJobRun.errorCode,
      errorMessage: prismaBackgroundJobRun.errorMessage,
      resultSummary: prismaBackgroundJobRun.resultSummary as BackgroundJobRunResultSummary | null,
      createdAt: prismaBackgroundJobRun.createdAt,
      updatedAt: prismaBackgroundJobRun.updatedAt,
    })
  }

  static toDomainList(prismaBackgroundJobRuns: PrismaBackgroundJobRun[] | null | undefined): BackgroundJobRun[] {
    if (!prismaBackgroundJobRuns?.length) return []

    return prismaBackgroundJobRuns
      .map((item) => this.toDomain(item))
      .filter((item): item is BackgroundJobRun => item !== null)
  }
}
