import { BackgroundJobRunStatus } from '../../../shared/enums'
import type { BackgroundJobRunResultSummary } from '../../interface/background-job'

export class BackgroundJobRun {
  backgroundJobRunId: number
  backgroundJobId: number
  scheduledAt: Date
  startedAt: Date
  status: BackgroundJobRunStatus
  workerId: string
  lockToken: string
  leaseExpiresAt: Date
  retryCount: number
  createdAt: Date
  updatedAt: Date
  finishedAt?: Date | null
  errorCode?: string | null
  errorMessage?: string | null
  resultSummary?: BackgroundJobRunResultSummary | null

  constructor(data: {
    backgroundJobRunId: number
    backgroundJobId: number
    scheduledAt: Date
    startedAt: Date
    status: BackgroundJobRunStatus
    workerId: string
    lockToken: string
    leaseExpiresAt: Date
    retryCount: number
    createdAt: Date
    updatedAt: Date
    finishedAt?: Date | null
    errorCode?: string | null
    errorMessage?: string | null
    resultSummary?: BackgroundJobRunResultSummary | null
  }) {
    this.backgroundJobRunId = data.backgroundJobRunId
    this.backgroundJobId = data.backgroundJobId
    this.scheduledAt = data.scheduledAt
    this.startedAt = data.startedAt
    this.status = data.status
    this.workerId = data.workerId
    this.lockToken = data.lockToken
    this.leaseExpiresAt = data.leaseExpiresAt
    this.retryCount = data.retryCount
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.finishedAt = data.finishedAt
    this.errorCode = data.errorCode
    this.errorMessage = data.errorMessage
    this.resultSummary = data.resultSummary
  }

  isRunning(): boolean {
    return this.status === BackgroundJobRunStatus.RUNNING
  }

  isFinished(): boolean {
    return this.status !== BackgroundJobRunStatus.RUNNING
  }

  isLeaseExpired(now: Date = new Date()): boolean {
    return this.isRunning() && this.leaseExpiresAt <= now
  }
}
