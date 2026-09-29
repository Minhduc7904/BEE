import type { IUnitOfWork } from '../../../domain/repositories'
import { NotificationDispatchRecipient } from '../../../domain/entities/notification'
import {
  NotificationDeliveryChannel,
  NotificationDispatchJobStatus,
  NotificationDispatchJobType,
  NotificationLevel,
  NotificationType,
} from '../../../shared/enums'
import { EnqueueNotificationDispatchJobUseCase } from './enqueue-notification-dispatch-job.use-case'

describe('EnqueueNotificationDispatchJobUseCase', () => {
  const findByIdempotencyKey = jest.fn()
  const createJob = jest.fn()
  const filterActiveUserIds = jest.fn()
  const createRecipients = jest.fn()
  const createDeliveries = jest.fn()
  const repos = {
    notificationDispatchJobRepository: { findByIdempotencyKey, create: createJob },
    notificationDispatchRecipientRepository: { createMany: createRecipients },
    notificationDeliveryRepository: { createMany: createDeliveries },
    userRepository: { filterActiveUserIds },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn((callback) => callback(repos)),
  } as unknown as IUnitOfWork
  const useCase = new EnqueueNotificationDispatchJobUseCase(unitOfWork)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('trả lại job cũ khi idempotency key đã tồn tại', async () => {
    findByIdempotencyKey.mockResolvedValue({
      notificationDispatchJobId: 17,
      recipientCount: 2,
      totalDeliveryCount: 4,
    })

    const result = await useCase.execute({
      idempotencyKey: 'campaign-17',
      userIds: [1, 2],
      channels: [NotificationDeliveryChannel.IN_APP],
      title: 'Thông báo',
      message: 'Nội dung',
    })

    expect(result).toEqual({
      notificationDispatchJobId: 17,
      recipientCount: 2,
      deliveryCount: 4,
      reused: true,
    })
    expect(filterActiveUserIds).not.toHaveBeenCalled()
    expect(createJob).not.toHaveBeenCalled()
  })

  it('lọc người dùng, loại trùng kênh và tạo delivery theo từng người nhận', async () => {
    const scheduledAt = new Date('2026-09-29T03:00:00.000Z')
    findByIdempotencyKey.mockResolvedValue(null)
    filterActiveUserIds.mockResolvedValue([1, 2])
    createJob.mockResolvedValue({
      notificationDispatchJobId: 31,
      jobType: NotificationDispatchJobType.BATCH,
      status: NotificationDispatchJobStatus.QUEUED,
      title: 'Thông báo',
      message: 'Nội dung',
      type: NotificationType.SYSTEM,
      level: NotificationLevel.INFO,
      scheduledAt,
      priority: 0,
      idempotencyKey: 'campaign-31',
      recipientCount: 2,
      totalDeliveryCount: 4,
      sentDeliveryCount: 0,
      skippedDeliveryCount: 0,
      deadDeliveryCount: 0,
      createdAt: scheduledAt,
      updatedAt: scheduledAt,
    })
    createRecipients.mockResolvedValue([
      new NotificationDispatchRecipient({
        notificationDispatchRecipientId: 101,
        notificationDispatchJobId: 31,
        userId: 1,
        createdAt: scheduledAt,
        updatedAt: scheduledAt,
      }),
      new NotificationDispatchRecipient({
        notificationDispatchRecipientId: 102,
        notificationDispatchJobId: 31,
        userId: 2,
        createdAt: scheduledAt,
        updatedAt: scheduledAt,
      }),
    ])
    createDeliveries.mockResolvedValue(4)

    const result = await useCase.execute({
      idempotencyKey: 'campaign-31',
      userIds: [1, 1, 2],
      channels: [
        NotificationDeliveryChannel.IN_APP,
        NotificationDeliveryChannel.PUSH,
        NotificationDeliveryChannel.PUSH,
      ],
      title: ' Thông báo ',
      message: ' Nội dung ',
      scheduledAt,
    })

    expect(filterActiveUserIds).toHaveBeenCalledWith([1, 2])
    expect(createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobType: NotificationDispatchJobType.BATCH,
        title: 'Thông báo',
        message: 'Nội dung',
        recipientCount: 2,
        totalDeliveryCount: 4,
      }),
    )
    expect(createDeliveries).toHaveBeenCalledWith([
      {
        notificationDispatchRecipientId: 101,
        channel: NotificationDeliveryChannel.IN_APP,
        availableAt: scheduledAt,
      },
      {
        notificationDispatchRecipientId: 101,
        channel: NotificationDeliveryChannel.PUSH,
        availableAt: scheduledAt,
      },
      {
        notificationDispatchRecipientId: 102,
        channel: NotificationDeliveryChannel.IN_APP,
        availableAt: scheduledAt,
      },
      {
        notificationDispatchRecipientId: 102,
        channel: NotificationDeliveryChannel.PUSH,
        availableAt: scheduledAt,
      },
    ])
    expect(result).toEqual({
      notificationDispatchJobId: 31,
      recipientCount: 2,
      deliveryCount: 4,
      reused: false,
    })
  })
})
