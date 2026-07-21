import { BackgroundJobLock } from '../entities/background-job'
import type { BackgroundJobLockListOptions } from '../interface/background-job'

export interface AcquireBackgroundJobLockData {
  backgroundJobId: number
  lockToken: string
  workerId: string
  lockedAt: Date
  leaseExpiresAt: Date
}

export interface IBackgroundJobLockRepository {
  findByBackgroundJobId(backgroundJobId: number): Promise<BackgroundJobLock | null>
  findAll(options: BackgroundJobLockListOptions): Promise<{ data: BackgroundJobLock[]; total: number }>
  tryAcquire(data: AcquireBackgroundJobLockData): Promise<BackgroundJobLock | null>
  release(backgroundJobId: number, lockToken: string): Promise<void>
}
