import type { IUnitOfWork } from '../../../domain/repositories'
import { NotificationDispatchRecipient } from '../../../domain/entities/notification'
import {
  NotificationDeliveryChannel,
  NotificationDispatchJobStatus,
  NotificationDispatchJobType,
  NotificationLevel,
  NotificationType,
  NotificationAudienceType,
  NotificationRecipientType,
  NotificationRecipientKind,
} from '../../../shared/enums'
import { EnqueueNotificationDispatchJobUseCase } from './enqueue-notification-dispatch-job.use-case'

describe('EnqueueNotificationDispatchJobUseCase', () => {
  const findByIdempotencyKey = jest.fn()
  const createJob = jest.fn()
  const resolveSnapshots = jest.fn()
  const createRecipients = jest.fn()
  const createDeliveries = jest.fn()
  const repos = {
    notificationDispatchJobRepository: { findByIdempotencyKey, create: createJob },
    notificationDispatchRecipientRepository: { createMany: createRecipients, resolveSnapshots },
    notificationDeliveryRepository: { createMany: createDeliveries },
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
      status: NotificationDispatchJobStatus.QUEUED,
      requestFingerprint: 'fingerprint-17',
      sentDeliveryCount: 1,
      skippedDeliveryCount: 2,
      deadDeliveryCount: 1,
    })

    const result = await useCase.execute({
      idempotencyKey: 'campaign-17',
      requestFingerprint: 'fingerprint-17',
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
      status: NotificationDispatchJobStatus.QUEUED,
      sentDeliveryCount: 1,
      skippedDeliveryCount: 2,
      deadDeliveryCount: 1,
    })
    expect(resolveSnapshots).not.toHaveBeenCalled()
    expect(createJob).not.toHaveBeenCalled()
  })

  it('chuẩn hóa idempotency key trước khi tìm job cũ', async () => {
    findByIdempotencyKey.mockResolvedValue({
      notificationDispatchJobId: 18,
      recipientCount: 1,
      totalDeliveryCount: 1,
      status: NotificationDispatchJobStatus.QUEUED,
      requestFingerprint: 'fingerprint-18',
    })

    await useCase.execute({
      idempotencyKey: '  campaign-18  ',
      requestFingerprint: 'fingerprint-18',
      userIds: [1],
      channels: [NotificationDeliveryChannel.IN_APP],
      title: 'Thông báo',
      message: 'Nội dung',
    })

    expect(findByIdempotencyKey).toHaveBeenCalledWith('campaign-18')
    expect(createJob).not.toHaveBeenCalled()
  })

  it('từ chối dùng lại idempotency key với payload khác', async () => {
    findByIdempotencyKey.mockResolvedValue({
      notificationDispatchJobId: 19,
      recipientCount: 1,
      totalDeliveryCount: 1,
      status: NotificationDispatchJobStatus.QUEUED,
      requestFingerprint: 'old-fingerprint',
    })

    await expect(
      useCase.execute({
        idempotencyKey: 'campaign-19',
        requestFingerprint: 'new-fingerprint',
        userIds: [1],
        channels: [NotificationDeliveryChannel.IN_APP],
        title: 'Thông báo',
        message: 'Nội dung',
      }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('lọc người dùng, loại trùng kênh và tạo delivery theo từng người nhận', async () => {
    const scheduledAt = new Date('2026-09-29T03:00:00.000Z')
    findByIdempotencyKey.mockResolvedValue(null)
    resolveSnapshots.mockResolvedValue([
      { userId: 1, profileId: 1, recipientType: NotificationRecipientType.PARENT, displayName: 'Phụ huynh A' },
      { userId: 2, profileId: 2, recipientType: NotificationRecipientType.STUDENT, displayName: 'Học sinh B' },
    ])
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
      requestFingerprint: 'fingerprint-31',
      audienceType: NotificationAudienceType.SPECIFIC_USERS,
      requestedChannels: [NotificationDeliveryChannel.IN_APP, NotificationDeliveryChannel.PUSH],
      recipientCount: 2,
      totalDeliveryCount: 3,
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
        recipientKey: 'USER:1',
        recipientKind: NotificationRecipientKind.USER,
        recipientType: NotificationRecipientType.PARENT,
        createdAt: scheduledAt,
        updatedAt: scheduledAt,
      }),
      new NotificationDispatchRecipient({
        notificationDispatchRecipientId: 102,
        notificationDispatchJobId: 31,
        userId: 2,
        recipientKey: 'USER:2',
        recipientKind: NotificationRecipientKind.USER,
        recipientType: NotificationRecipientType.STUDENT,
        createdAt: scheduledAt,
        updatedAt: scheduledAt,
      }),
    ])
    createDeliveries.mockResolvedValue(3)

    const result = await useCase.execute({
      idempotencyKey: 'campaign-31',
      requestFingerprint: 'fingerprint-31',
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

    expect(resolveSnapshots).toHaveBeenCalledWith([1, 2])
    expect(createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobType: NotificationDispatchJobType.BATCH,
        title: 'Thông báo',
        message: 'Nội dung',
        recipientCount: 2,
        totalDeliveryCount: 3,
      }),
    )
    expect(createDeliveries).toHaveBeenCalledWith([
      {
        notificationDispatchRecipientId: 101,
        channel: NotificationDeliveryChannel.IN_APP,
        payload: expect.objectContaining({ title: 'Thông báo', message: 'Nội dung' }),
        availableAt: scheduledAt,
      },
      {
        notificationDispatchRecipientId: 101,
        channel: NotificationDeliveryChannel.PUSH,
        payload: expect.objectContaining({ title: 'Thông báo', message: 'Nội dung' }),
        availableAt: scheduledAt,
      },
      {
        notificationDispatchRecipientId: 102,
        channel: NotificationDeliveryChannel.IN_APP,
        payload: expect.objectContaining({ title: 'Thông báo', message: 'Nội dung' }),
        availableAt: scheduledAt,
      },
    ])
    expect(result).toEqual({
      notificationDispatchJobId: 31,
      recipientCount: 2,
      deliveryCount: 3,
      reused: false,
      status: NotificationDispatchJobStatus.QUEUED,
      sentDeliveryCount: 0,
      skippedDeliveryCount: 0,
      deadDeliveryCount: 0,
    })
  })
})
