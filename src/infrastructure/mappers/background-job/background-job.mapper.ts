import type { BackgroundJob as PrismaBackgroundJob } from '@prisma/client'

import { BackgroundJob } from '../../../domain/entities/background-job'
import { BackgroundJobCode } from '../../../shared/enums'

export class BackgroundJobMapper {
  static toDomain(prismaBackgroundJob: PrismaBackgroundJob | null | undefined): BackgroundJob | null {
    if (!prismaBackgroundJob) return null

    return new BackgroundJob({
      backgroundJobId: prismaBackgroundJob.backgroundJobId,
      code: prismaBackgroundJob.code as BackgroundJobCode,
      displayName: prismaBackgroundJob.displayName,
      cronExpression: prismaBackgroundJob.cronExpression,
      timezone: prismaBackgroundJob.timezone,
      isEnabled: prismaBackgroundJob.isEnabled,
      maxRuntimeSeconds: prismaBackgroundJob.maxRuntimeSeconds,
      createdAt: prismaBackgroundJob.createdAt,
      updatedAt: prismaBackgroundJob.updatedAt,
    })
  }

  static toDomainList(prismaBackgroundJobs: PrismaBackgroundJob[] | null | undefined): BackgroundJob[] {
    if (!prismaBackgroundJobs?.length) return []

    return prismaBackgroundJobs
      .map((item) => this.toDomain(item))
      .filter((item): item is BackgroundJob => item !== null)
  }
}
