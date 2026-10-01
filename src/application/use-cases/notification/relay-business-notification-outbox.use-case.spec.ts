import type { IUnitOfWork } from '../../../domain/repositories'
import { BusinessNotificationOutboxStatus } from '../../../shared/enums'
import type { BusinessNotificationQueueService } from './business-notification-queue.service'
import { RelayBusinessNotificationOutboxUseCase } from './relay-business-notification-outbox.use-case'

describe('RelayBusinessNotificationOutboxUseCase', () => {
  const event = {
    businessNotificationOutboxId: 7,
    payload: { idempotencyKey: 'event:7', recipients: [{ recipientKey: 'USER:1' }] },
    attemptCount: 1,
    maxAttempts: 10,
    canRetry: () => true,
  }
  const updateOutbox = jest.fn()
  const release = jest.fn()
  const repos = {
    businessNotificationOutboxRepository: {
      hasDue: jest.fn().mockResolvedValue(true),
      recoverExpired: jest.fn().mockResolvedValue(0),
      claimDueBatch: jest.fn().mockResolvedValue([event]),
      update: updateOutbox,
    },
    backgroundJobRepository: {
      upsert: jest.fn().mockResolvedValue({ backgroundJobId: 1, maxRuntimeSeconds: 60, canRun: () => true }),
    },
    backgroundJobLockRepository: {
      tryAcquire: jest.fn().mockResolvedValue({ leaseExpiresAt: new Date(Date.now() + 60_000) }),
      release,
    },
    backgroundJobRunRepository: {
      findLatestByBackgroundJobId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ backgroundJobRunId: 2 }),
      update: jest.fn().mockResolvedValue({}),
    },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn((callback) => callback(repos)),
  } as unknown as IUnitOfWork
  const publishOutbox = jest.fn()
  const service = new RelayBusinessNotificationOutboxUseCase(unitOfWork, {
    publishOutbox,
  } as unknown as BusinessNotificationQueueService)

  beforeEach(() => {
    jest.clearAllMocks()
    repos.businessNotificationOutboxRepository.hasDue.mockResolvedValue(true)
    repos.businessNotificationOutboxRepository.recoverExpired.mockResolvedValue(0)
    repos.businessNotificationOutboxRepository.claimDueBatch.mockResolvedValue([event])
    repos.backgroundJobLockRepository.tryAcquire.mockResolvedValue({ leaseExpiresAt: new Date(Date.now() + 60_000) })
    publishOutbox.mockResolvedValue({ notificationDispatchJobId: 9 })
  })

  it('publish thành công rồi đánh dấu PUBLISHED và nhả lock', async () => {
    const result = await service.executeScheduled('worker-1')

    expect(publishOutbox).toHaveBeenCalledWith(event.payload)
    expect(updateOutbox).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        status: BusinessNotificationOutboxStatus.PUBLISHED,
        publishedAt: expect.any(Date),
      }),
    )
    expect(result).toEqual(expect.objectContaining({ claimed: 1, published: 1, retried: 0, dead: 0 }))
    expect(release).toHaveBeenCalled()
  })

  it('lỗi publish được đưa về RETRY_WAIT, không làm mất event', async () => {
    publishOutbox.mockRejectedValueOnce(new Error('dispatch database unavailable'))

    const result = await service.executeScheduled('worker-1')

    expect(updateOutbox).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        status: BusinessNotificationOutboxStatus.RETRY_WAIT,
        availableAt: expect.any(Date),
        lastErrorCode: 'OUTBOX_PUBLISH_FAILED',
      }),
    )
    expect(result).toEqual(expect.objectContaining({ published: 0, retried: 1 }))
  })
})
