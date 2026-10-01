import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type { BusinessNotificationOutbox } from '../../../domain/entities/notification'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BackgroundJobCode, BackgroundJobRunStatus, BusinessNotificationOutboxStatus } from '../../../shared/enums'
import { BusinessNotificationQueueService, type EnqueueBusinessJobInput } from './business-notification-queue.service'

const JOB_CONFIG = {
  code: BackgroundJobCode.BUSINESS_NOTIFICATION_OUTBOX_RELAY,
  displayName: 'Chuyển tiếp outbox notification nghiệp vụ',
  cronExpression: '*/10 * * * * *',
  timezone: 'Asia/Ho_Chi_Minh',
  isEnabled: true,
  maxRuntimeSeconds: 60,
} as const
const BATCH_SIZE = 100
const LEASE_MILLISECONDS = 120_000

export interface BusinessNotificationOutboxRunResult {
  backgroundJobRunId: number
  claimed: number
  published: number
  retried: number
  dead: number
  recovered: number
}

@Injectable()
export class RelayBusinessNotificationOutboxUseCase {
  private readonly logger = new Logger(RelayBusinessNotificationOutboxUseCase.name)

  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly queue: BusinessNotificationQueueService,
  ) {}

  async executeScheduled(workerId: string): Promise<BusinessNotificationOutboxRunResult | null> {
    const now = new Date()
    const hasDue = await this.unitOfWork.executeInTransaction((repos) =>
      repos.businessNotificationOutboxRepository.hasDue(now),
    )
    if (!hasDue) return null

    const job = await this.unitOfWork.executeInTransaction((repos) => repos.backgroundJobRepository.upsert(JOB_CONFIG))
    if (!job.canRun()) return null
    const execution = await this.acquireExecution(job.backgroundJobId, job.maxRuntimeSeconds, workerId)
    if (!execution) throw new ConflictException('BUSINESS_NOTIFICATION_OUTBOX_RELAY_ALREADY_RUNNING')

    const result = { claimed: 0, published: 0, retried: 0, dead: 0, recovered: 0 }
    try {
      result.recovered = await this.unitOfWork.executeInTransaction((repos) =>
        repos.businessNotificationOutboxRepository.recoverExpired(new Date()),
      )
      const claimedAt = new Date()
      const events = await this.unitOfWork.executeInTransaction((repos) =>
        repos.businessNotificationOutboxRepository.claimDueBatch(
          workerId,
          claimedAt,
          new Date(claimedAt.getTime() + LEASE_MILLISECONDS),
          BATCH_SIZE,
        ),
      )
      result.claimed = events.length
      for (const event of events) {
        const outcome = await this.publish(event)
        result[outcome] += 1
      }
      await this.unitOfWork.executeInTransaction((repos) =>
        repos.backgroundJobRunRepository.update(execution.backgroundJobRunId, {
          status: BackgroundJobRunStatus.SUCCEEDED,
          finishedAt: new Date(),
          resultSummary: result,
        }),
      )
      return { backgroundJobRunId: execution.backgroundJobRunId, ...result }
    } catch (error) {
      await this.failExecution(execution.backgroundJobRunId, error)
      throw error
    } finally {
      await this.unitOfWork.executeInTransaction((repos) =>
        repos.backgroundJobLockRepository.release(execution.backgroundJobId, execution.lockToken),
      )
    }
  }

  private async publish(event: BusinessNotificationOutbox): Promise<'published' | 'retried' | 'dead'> {
    try {
      await this.queue.publishOutbox(event.payload as unknown as EnqueueBusinessJobInput)
      await this.unitOfWork.executeInTransaction((repos) =>
        repos.businessNotificationOutboxRepository.update(event.businessNotificationOutboxId, {
          status: BusinessNotificationOutboxStatus.PUBLISHED,
          publishedAt: new Date(),
          lastErrorCode: null,
          lastErrorMessage: null,
          claimedBy: null,
          claimedAt: null,
          leaseExpiresAt: null,
        }),
      )
      return 'published'
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const dead = !event.canRetry()
      await this.unitOfWork.executeInTransaction((repos) =>
        repos.businessNotificationOutboxRepository.update(event.businessNotificationOutboxId, {
          status: dead ? BusinessNotificationOutboxStatus.DEAD : BusinessNotificationOutboxStatus.RETRY_WAIT,
          ...(!dead && { availableAt: new Date(Date.now() + this.retryDelay(event.attemptCount)) }),
          lastErrorCode: 'OUTBOX_PUBLISH_FAILED',
          lastErrorMessage: message.slice(0, 1_000),
          claimedBy: null,
          claimedAt: null,
          leaseExpiresAt: null,
        }),
      )
      this.logger.warn(`Outbox #${event.businessNotificationOutboxId} publish thất bại: ${message}`)
      return dead ? 'dead' : 'retried'
    }
  }

  private retryDelay(attemptCount: number): number {
    return Math.min(30_000 * 2 ** Math.max(0, attemptCount - 1), 30 * 60_000)
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
        leaseExpiresAt: new Date(now.getTime() + maxRuntimeSeconds * 1_000),
      })
      if (!lock) return null
      const latestRun = await repos.backgroundJobRunRepository.findLatestByBackgroundJobId(backgroundJobId)
      const scheduledAt = new Date(now)
      scheduledAt.setMilliseconds(0)
      if (latestRun && latestRun.scheduledAt >= scheduledAt)
        scheduledAt.setTime(latestRun.scheduledAt.getTime() + 1_000)
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

  private async failExecution(backgroundJobRunId: number, error: unknown): Promise<void> {
    await this.unitOfWork.executeInTransaction((repos) =>
      repos.backgroundJobRunRepository.update(backgroundJobRunId, {
        status: BackgroundJobRunStatus.FAILED,
        finishedAt: new Date(),
        errorCode: 'BUSINESS_NOTIFICATION_OUTBOX_RELAY_FAILED',
        errorMessage: error instanceof Error ? error.message.slice(0, 1_000) : 'Lỗi relay outbox không xác định',
      }),
    )
  }
}
