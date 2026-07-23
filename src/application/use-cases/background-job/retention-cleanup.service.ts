import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'

import type { CreateBackgroundJobData } from '../../../domain/interface/background-job'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { BackgroundJobCode, BackgroundJobRunStatus } from '../../../shared/enums'

const AUDIT_LOG_RETENTION_DAYS = 30
const BACKGROUND_JOB_RUN_RETENTION_DAYS = 7

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

export interface RetentionCleanupResult {
  backgroundJobRunId: number
  deletedCount: number
  retentionDays: number
  cutoffAt: string
}

type CleanupOperation = (repos: UnitOfWorkRepos, cutoff: Date) => Promise<number>

@Injectable()
export class RetentionCleanupService {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  executeAuditLogCleanup(workerId: string): Promise<RetentionCleanupResult | null> {
    return this.executeScheduled(
      AUDIT_LOG_RETENTION_CLEANUP_JOB,
      AUDIT_LOG_RETENTION_DAYS,
      workerId,
      (repos, cutoff) => repos.adminAuditLogRepository.deleteOlderThan(cutoff),
    )
  }

  executeBackgroundJobRunCleanup(workerId: string): Promise<RetentionCleanupResult | null> {
    return this.executeScheduled(
      BACKGROUND_JOB_RUN_RETENTION_CLEANUP_JOB,
      BACKGROUND_JOB_RUN_RETENTION_DAYS,
      workerId,
      (repos, cutoff) => repos.backgroundJobRunRepository.deleteFinishedBefore(cutoff),
    )
  }

  private async executeScheduled(
    jobConfig: CreateBackgroundJobData,
    retentionDays: number,
    workerId: string,
    cleanup: CleanupOperation,
  ): Promise<RetentionCleanupResult | null> {
    const job = await this.unitOfWork.executeInTransaction((repos) =>
      repos.backgroundJobRepository.upsert(jobConfig),
    )
    if (!job.canRun()) return null

    const execution = await this.acquireExecution(job.backgroundJobId, job.maxRuntimeSeconds, workerId)
    if (!execution) throw new ConflictException('RETENTION_CLEANUP_ALREADY_RUNNING')

    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    try {
      const deletedCount = await this.unitOfWork.executeInTransaction((repos) => cleanup(repos, cutoff))
      const result = { deletedCount, retentionDays, cutoffAt: cutoff.toISOString() }
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

  private async acquireExecution(backgroundJobId: number, maxRuntimeSeconds: number, workerId: string) {
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
      return { backgroundJobId, backgroundJobRunId: run.backgroundJobRunId, lockToken }
    })
  }

  private async completeExecution(
    backgroundJobRunId: number,
    result: Omit<RetentionCleanupResult, 'backgroundJobRunId'>,
  ): Promise<void> {
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
