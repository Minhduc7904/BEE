export class BackgroundJobLock {
  backgroundJobId: number
  lockToken: string
  workerId: string
  lockedAt: Date
  leaseExpiresAt: Date
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    backgroundJobId: number
    lockToken: string
    workerId: string
    lockedAt: Date
    leaseExpiresAt: Date
    createdAt: Date
    updatedAt: Date
  }) {
    this.backgroundJobId = data.backgroundJobId
    this.lockToken = data.lockToken
    this.workerId = data.workerId
    this.lockedAt = data.lockedAt
    this.leaseExpiresAt = data.leaseExpiresAt
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  isActive(now: Date = new Date()): boolean {
    return this.leaseExpiresAt > now
  }
}
