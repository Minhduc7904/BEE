import { BackgroundJobCode, BackgroundJobRunStatus } from '../../../shared/enums'

export interface BackgroundJobRunResultSummary {
  [key: string]: BackgroundJobRunResultValue
}

export type BackgroundJobRunResultValue =
  | string
  | number
  | boolean
  | null
  | BackgroundJobRunResultSummary
  | BackgroundJobRunResultValue[]

export interface CreateBackgroundJobData {
  code: BackgroundJobCode
  displayName: string
  cronExpression: string
  timezone?: string
  isEnabled?: boolean
  maxRuntimeSeconds?: number
}

export interface UpdateBackgroundJobData {
  displayName?: string
  cronExpression?: string
  timezone?: string
  isEnabled?: boolean
  maxRuntimeSeconds?: number
}

export interface BackgroundJobListOptions {
  skip?: number
  take?: number
  code?: BackgroundJobCode
  isEnabled?: boolean
  search?: string
  sortBy?: 'backgroundJobId' | 'code' | 'displayName' | 'isEnabled' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface BackgroundJobLockListOptions {
  skip?: number
  take?: number
  backgroundJobId?: number
  isActive?: boolean
  search?: string
  sortBy?: 'backgroundJobId' | 'workerId' | 'lockedAt' | 'leaseExpiresAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface BackgroundJobRunListOptions {
  skip?: number
  take?: number
  backgroundJobId?: number
  status?: BackgroundJobRunStatus
  workerId?: string
  fromScheduledAt?: Date
  toScheduledAt?: Date
  sortBy?: 'backgroundJobRunId' | 'backgroundJobId' | 'scheduledAt' | 'startedAt' | 'finishedAt' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface CreateBackgroundJobRunData {
  backgroundJobId: number
  scheduledAt: Date
  startedAt: Date
  status?: BackgroundJobRunStatus
  workerId: string
  lockToken: string
  leaseExpiresAt: Date
  retryCount?: number
  finishedAt?: Date | null
  errorCode?: string | null
  errorMessage?: string | null
  resultSummary?: BackgroundJobRunResultSummary | null
}

export interface UpdateBackgroundJobRunData {
  status?: BackgroundJobRunStatus
  leaseExpiresAt?: Date
  retryCount?: number
  finishedAt?: Date | null
  errorCode?: string | null
  errorMessage?: string | null
  resultSummary?: BackgroundJobRunResultSummary | null
}
