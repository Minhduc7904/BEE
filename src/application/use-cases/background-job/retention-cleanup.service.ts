import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'

import type { BackgroundJobRunResultSummary, CreateBackgroundJobData } from '../../../domain/interface/background-job'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BackgroundJobCode, BackgroundJobRunStatus } from '../../../shared/enums'

const AUDIT_LOG_RETENTION_DAYS = 30
const BACKGROUND_JOB_RUN_RETENTION_DAYS = 7
const USER_REFRESH_TOKEN_BATCH_SIZE = 1_000
const CLEANUP_DEADLINE_RESERVE_MILLISECONDS = 60_000

export const AUDIT_LOG_RETENTION_CLEANUP_JOB: CreateBackgroundJobData = {
  code: BackgroundJobCode.AUDIT_LOG_RETENTION_CLEANUP,
  displayName: 'Dọn audit log quá hạn',
  cronExpression: '0 0 3 * * *',
  timezone: 'Asia/Ho_Chi_Minh',
  isEnabled: true,
  maxRuntimeSeconds: 900,
}

export const BACKGROUND_JOB_RUN_RETENTION_CLEANUP_JOB: CreateBackgroundJobData = {
  code: BackgroundJobCode.BACKGROUND_JOB_RUN_RETENTION_CLEANUP,
  displayName: 'Dọn lịch sử chạy job quá hạn',
  cronExpression: '0 10 3 * * *',
  timezone: 'Asia/Ho_Chi_Minh',
  isEnabled: true,
  maxRuntimeSeconds: 900,
}

export const USER_REFRESH_TOKEN_CLEANUP_JOB: CreateBackgroundJobData = {
  code: BackgroundJobCode.USER_REFRESH_TOKEN_CLEANUP,
  displayName: 'Dọn refresh token hết hạn',
  cronExpression: '0 20 3 * * *',
  timezone: 'Asia/Ho_Chi_Minh',
  isEnabled: true,
  maxRuntimeSeconds: 900,
}

export interface RetentionCleanupResult {
  backgroundJobRunId: number
  deletedCount: number
  retentionDays: number
  cutoffAt: string
}

export interface UserRefreshTokenCleanupResult {
  backgroundJobRunId: number
  deletedCount: number
  batchCount: number
  batchSize: number
  cutoffAt: string
  hasMore: boolean
}

interface CleanupTiming {
  startedAt: Date
  stopAt: Date
}

interface CleanupExecution {
  backgroundJobId: number
  backgroundJobRunId: number
  lockToken: string
  startedAt: Date
  leaseExpiresAt: Date
}

type CleanupOperation<TSummary extends BackgroundJobRunResultSummary> = (timing: CleanupTiming) => Promise<TSummary>

@Injectable()
export class RetentionCleanupService {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  executeAuditLogCleanup(workerId: string): Promise<RetentionCleanupResult | null> {
    return this.executeScheduled(AUDIT_LOG_RETENTION_CLEANUP_JOB, workerId, async ({ startedAt }) => {
      const cutoff = new Date(startedAt.getTime() - AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000)
      const deletedCount = await this.unitOfWork.executeInTransaction((repos) =>
        repos.adminAuditLogRepository.deleteOlderThan(cutoff),
      )
      return {
        deletedCount,
        retentionDays: AUDIT_LOG_RETENTION_DAYS,
        cutoffAt: cutoff.toISOString(),
      }
    })
  }

  executeBackgroundJobRunCleanup(workerId: string): Promise<RetentionCleanupResult | null> {
    return this.executeScheduled(BACKGROUND_JOB_RUN_RETENTION_CLEANUP_JOB, workerId, async ({ startedAt }) => {
      const cutoff = new Date(startedAt.getTime() - BACKGROUND_JOB_RUN_RETENTION_DAYS * 24 * 60 * 60 * 1000)
      const deletedCount = await this.unitOfWork.executeInTransaction((repos) =>
        repos.backgroundJobRunRepository.deleteFinishedBefore(cutoff),
      )
      return {
        deletedCount,
        retentionDays: BACKGROUND_JOB_RUN_RETENTION_DAYS,
        cutoffAt: cutoff.toISOString(),
      }
    })
  }

  executeUserRefreshTokenCleanup(workerId: string): Promise<UserRefreshTokenCleanupResult | null> {
    return this.executeScheduled(USER_REFRESH_TOKEN_CLEANUP_JOB, workerId, ({ startedAt, stopAt }) =>
      this.deleteExpiredUserRefreshTokens(startedAt, stopAt),
    )
  }

  private async executeScheduled<TSummary extends BackgroundJobRunResultSummary>(
    jobConfig: CreateBackgroundJobData,
    workerId: string,
    cleanup: CleanupOperation<TSummary>,
  ): Promise<(TSummary & { backgroundJobRunId: number }) | null> {
    const job = await this.unitOfWork.executeInTransaction((repos) => repos.backgroundJobRepository.upsert(jobConfig))
    if (!job.canRun()) return null

    const execution = await this.acquireExecution(job.backgroundJobId, job.maxRuntimeSeconds, workerId)
    if (!execution) throw new ConflictException('RETENTION_CLEANUP_ALREADY_RUNNING')

    const stopAt = new Date(execution.leaseExpiresAt.getTime() - CLEANUP_DEADLINE_RESERVE_MILLISECONDS)
    try {
      const result = await cleanup({ startedAt: execution.startedAt, stopAt })
      await this.completeExecution(execution.backgroundJobRunId, result)
      return { backgroundJobRunId: execution.backgroundJobRunId, ...result }
    } catch (error) {
      await this.failExecution(execution.backgroundJobRunId, jobConfig.code, error)
      throw error
    } finally {
      await this.unitOfWork.executeInTransaction((repos) =>
        repos.backgroundJobLockRepository.release(execution.backgroundJobId, execution.lockToken),
      )
    }
  }

  private async deleteExpiredUserRefreshTokens(
    cutoffAt: Date,
    stopAt: Date,
  ): Promise<Omit<UserRefreshTokenCleanupResult, 'backgroundJobRunId'>> {
    let deletedCount = 0
    let batchCount = 0
    let hasMore = true

    while (Date.now() < stopAt.getTime()) {
      const currentBatchCount = await this.unitOfWork.executeInTransaction((repos) =>
        repos.userRefreshTokenRepository.deleteExpiredTokens(cutoffAt, USER_REFRESH_TOKEN_BATCH_SIZE),
      )

      if (currentBatchCount === 0) {
        hasMore = false
        break
      }

      deletedCount += currentBatchCount
      batchCount += 1
      hasMore = currentBatchCount === USER_REFRESH_TOKEN_BATCH_SIZE

      if (!hasMore) break
    }

    return {
      deletedCount,
      batchCount,
      batchSize: USER_REFRESH_TOKEN_BATCH_SIZE,
      cutoffAt: cutoffAt.toISOString(),
      hasMore,
    }
  }

  private async acquireExecution(
    backgroundJobId: number,
    maxRuntimeSeconds: number,
    workerId: string,
  ): Promise<CleanupExecution | null> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const now = new Date()
      const lockToken = randomUUID()
      const lock = await repos.backgroundJobLockRepository.tryAcquire({
        backgroundJobId,
        lockToken,
        workerId,
        lockedAt: now,
        leaseExpiresAt: new Date(now.getTime() + maxRuntimeSeconds * 1000),
      })
      if (!lock) return null

      const latestRun = await repos.backgroundJobRunRepository.findLatestByBackgroundJobId(backgroundJobId)
      const scheduledAt = new Date(now)
      scheduledAt.setMilliseconds(0)
      if (latestRun && latestRun.scheduledAt >= scheduledAt) {
        scheduledAt.setTime(latestRun.scheduledAt.getTime() + 1000)
      }
      const run = await repos.backgroundJobRunRepository.create({
        backgroundJobId,
        scheduledAt,
        startedAt: now,
        status: BackgroundJobRunStatus.RUNNING,
        workerId,
        lockToken,
        leaseExpiresAt: lock.leaseExpiresAt,
      })
      return {
        backgroundJobId,
        backgroundJobRunId: run.backgroundJobRunId,
        lockToken,
        startedAt: now,
        leaseExpiresAt: lock.leaseExpiresAt,
      }
    })
  }

  private async completeExecution(backgroundJobRunId: number, result: BackgroundJobRunResultSummary): Promise<void> {
    await this.unitOfWork.executeInTransaction((repos) =>
      repos.backgroundJobRunRepository.update(backgroundJobRunId, {
        status: BackgroundJobRunStatus.SUCCEEDED,
        finishedAt: new Date(),
        resultSummary: result,
      }),
    )
  }

  private async failExecution(backgroundJobRunId: number, jobCode: BackgroundJobCode, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message.slice(0, 1000) : 'Lỗi không xác định khi dọn dữ liệu quá hạn'
    await this.unitOfWork.executeInTransaction((repos) =>
      repos.backgroundJobRunRepository.update(backgroundJobRunId, {
        status: BackgroundJobRunStatus.FAILED,
        finishedAt: new Date(),
        errorCode: `${jobCode}_FAILED`,
        errorMessage: message,
      }),
    )
  }
}
