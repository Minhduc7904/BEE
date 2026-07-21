import { BackgroundJob, BackgroundJobLock, BackgroundJobRun } from '../../../domain/entities/background-job'
import { SepayTransactionSyncCursor } from '../../../domain/entities/sepay'
import type { BackgroundJobRunResultSummary } from '../../../domain/interface/background-job'
import { BackgroundJobCode, BackgroundJobRunStatus } from '../../../shared/enums'
import { IsRequiredBoolean } from '../../../shared/decorators/validate'

export class UpdateBackgroundJobDto {
  @IsRequiredBoolean('Trạng thái bật job')
  isEnabled: boolean
}

export class BackgroundJobResponseDto {
  backgroundJobId: number
  code: BackgroundJobCode
  displayName: string
  cronExpression: string
  timezone: string
  isEnabled: boolean
  maxRuntimeSeconds: number
  createdAt: Date
  updatedAt: Date

  static fromBackgroundJob(job: BackgroundJob): BackgroundJobResponseDto {
    return {
      backgroundJobId: job.backgroundJobId,
      code: job.code,
      displayName: job.displayName,
      cronExpression: job.cronExpression,
      timezone: job.timezone,
      isEnabled: job.isEnabled,
      maxRuntimeSeconds: job.maxRuntimeSeconds,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }
  }

  static fromBackgroundJobList(jobs: BackgroundJob[]): BackgroundJobResponseDto[] {
    return jobs.map((job) => this.fromBackgroundJob(job))
  }
}

export class BackgroundJobLockResponseDto {
  backgroundJobId: number
  workerId: string
  lockedAt: Date
  leaseExpiresAt: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  static fromBackgroundJobLock(lock: BackgroundJobLock): BackgroundJobLockResponseDto {
    return {
      backgroundJobId: lock.backgroundJobId,
      workerId: lock.workerId,
      lockedAt: lock.lockedAt,
      leaseExpiresAt: lock.leaseExpiresAt,
      isActive: lock.isActive(),
      createdAt: lock.createdAt,
      updatedAt: lock.updatedAt,
    }
  }

  static fromBackgroundJobLockList(locks: BackgroundJobLock[]): BackgroundJobLockResponseDto[] {
    return locks.map((lock) => this.fromBackgroundJobLock(lock))
  }
}

export class BackgroundJobRunResponseDto {
  backgroundJobRunId: number
  backgroundJobId: number
  scheduledAt: Date
  startedAt: Date
  finishedAt?: Date | null
  status: BackgroundJobRunStatus
  workerId: string
  leaseExpiresAt: Date
  retryCount: number
  errorCode?: string | null
  errorMessage?: string | null
  resultSummary?: BackgroundJobRunResultSummary | null
  createdAt: Date
  updatedAt: Date

  static fromBackgroundJobRun(run: BackgroundJobRun): BackgroundJobRunResponseDto {
    return {
      backgroundJobRunId: run.backgroundJobRunId,
      backgroundJobId: run.backgroundJobId,
      scheduledAt: run.scheduledAt,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      status: run.status,
      workerId: run.workerId,
      leaseExpiresAt: run.leaseExpiresAt,
      retryCount: run.retryCount,
      errorCode: run.errorCode,
      errorMessage: run.errorMessage,
      resultSummary: run.resultSummary,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    }
  }

  static fromBackgroundJobRunList(runs: BackgroundJobRun[]): BackgroundJobRunResponseDto[] {
    return runs.map((run) => this.fromBackgroundJobRun(run))
  }
}

export class SepayTransactionSyncCursorResponseDto {
  sepayTransactionSyncCursorId: number
  scope: string
  lastSinceId?: string | null
  lastSyncedAt?: Date | null
  lastErrorAt?: Date | null
  lastErrorMessage?: string | null
  createdAt: Date
  updatedAt: Date

  static fromSepayTransactionSyncCursor(cursor: SepayTransactionSyncCursor): SepayTransactionSyncCursorResponseDto {
    return {
      sepayTransactionSyncCursorId: cursor.sepayTransactionSyncCursorId,
      scope: cursor.scope,
      lastSinceId: cursor.lastSinceId,
      lastSyncedAt: cursor.lastSyncedAt,
      lastErrorAt: cursor.lastErrorAt,
      lastErrorMessage: cursor.lastErrorMessage,
      createdAt: cursor.createdAt,
      updatedAt: cursor.updatedAt,
    }
  }

  static fromSepayTransactionSyncCursorList(
    cursors: SepayTransactionSyncCursor[],
  ): SepayTransactionSyncCursorResponseDto[] {
    return cursors.map((cursor) => this.fromSepayTransactionSyncCursor(cursor))
  }
}
