// src/infrastructure/mappers/job/job.mapper.ts

import { Job } from '../../../domain/entities/job/job.entity'
import { JobStatus, JobType } from '../../../shared/enums'
import { UserMapper } from '../user/user.mapper'

/**
 * Mapper class để convert từ Prisma Job model
 * sang Domain Job entity
 */
export class JobMapper {
  /**
   * Convert Prisma Job sang Domain Job
   */
  static toDomainJob(prismaJob: any): Job | undefined {
    if (!prismaJob) return undefined

    return new Job({
      jobId: prismaJob.jobId,
      type: prismaJob.type as JobType,
      status: prismaJob.status as JobStatus,
      priority: prismaJob.priority,
      retryCount: prismaJob.retryCount,
      maxRetries: prismaJob.maxRetries,
      createdAt: prismaJob.createdAt,
      updatedAt: prismaJob.updatedAt,

      // Optional fields
      payload: prismaJob.payload ?? undefined,
      result: prismaJob.result ?? undefined,
      errorMessage: prismaJob.errorMessage ?? undefined,
      errorStack: prismaJob.errorStack ?? undefined,
      scheduledAt: prismaJob.scheduledAt ?? undefined,
      startedAt: prismaJob.startedAt ?? undefined,
      completedAt: prismaJob.completedAt ?? undefined,
      createdBy: prismaJob.createdBy ?? undefined,
      metadata: prismaJob.metadata ?? undefined,

      // Relations
      creator: prismaJob.creator ? UserMapper.toDomainUser(prismaJob.creator) : undefined,
    })
  }

  /**
   * Convert array Prisma Jobs sang Domain Jobs
   */
  static toDomainJobs(prismaJobs: any[] | null | undefined): Job[] {
    if (!prismaJobs || prismaJobs.length === 0) return []

    return prismaJobs.map((job) => this.toDomainJob(job)).filter(Boolean) as Job[]
  }
}
