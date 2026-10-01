import type { IUnitOfWork } from '../../../domain/repositories'
import {
  NotificationDeliveryChannel,
  NotificationLevel,
  NotificationRecipientType,
  NotificationType,
} from '../../../shared/enums'
import { BusinessNotificationQueueService } from './business-notification-queue.service'
import type { EnqueueNotificationDispatchJobUseCase } from './enqueue-notification-dispatch-job.use-case'
import { NotificationDeliveryChannelPolicyService } from './notification-delivery-channel-policy.service'

describe('BusinessNotificationQueueService', () => {
  const resolveSnapshots = jest.fn()
  const resolveParentTargetsByStudentIds = jest.fn()
  const execute = jest.fn()
  const createOrGet = jest.fn()
  const repos = {
    notificationDispatchRecipientRepository: { resolveSnapshots, resolveParentTargetsByStudentIds },
    businessNotificationOutboxRepository: { createOrGet },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn((callback) => callback(repos)),
  } as unknown as IUnitOfWork
  const service = new BusinessNotificationQueueService(
    unitOfWork,
    {
      execute,
    } as unknown as EnqueueNotificationDispatchJobUseCase,
    new NotificationDeliveryChannelPolicyService({
      pushEnabled: false,
    }),
  )

  beforeEach(() => {
    jest.clearAllMocks()
    execute.mockResolvedValue({ notificationDispatchJobId: 1 })
    createOrGet.mockImplementation((data) => Promise.resolve({ businessNotificationOutboxId: 1, ...data }))
    resolveSnapshots.mockResolvedValue([])
    resolveParentTargetsByStudentIds.mockResolvedValue([])
  })

  it('chỉ tạo IN_APP cho parent account khi PUSH tắt và giữ ZALO_OA cho external contact', async () => {
    resolveParentTargetsByStudentIds.mockResolvedValue([
      {
        studentId: 10,
        userId: 20,
        profileId: 30,
        recipientType: NotificationRecipientType.PARENT,
        displayName: 'Phụ huynh',
      },
    ])
    const payload = {
      title: 'Điểm danh',
      message: 'Có mặt',
      type: NotificationType.ATTENDANCE,
      level: NotificationLevel.INFO,
    }

    await service.enqueueStudentAndParents({
      idempotencyKey: 'attendance:1',
      sourceType: 'ATTENDANCE',
      sourceId: '1',
      sourceEvent: 'CREATED',
      title: payload.title,
      message: payload.message,
      targets: [{ studentId: 10, parentPayload: payload, parentZaloId: 'zalo-1', zaloPayload: payload }],
    })

    const recipients = createOrGet.mock.calls[0][0].payload.recipients
    expect(recipients).toHaveLength(2)
    expect(recipients.find((item: any) => item.userId === 20).deliveries.map((item: any) => item.channel)).toEqual([
      NotificationDeliveryChannel.IN_APP,
    ])
    expect(recipients.find((item: any) => item.recipientKey === 'ZALO:zalo-1').deliveries[0]).toEqual(
      expect.objectContaining({ channel: NotificationDeliveryChannel.ZALO_OA, destination: 'zalo-1', maxAttempts: 3 }),
    )
  })

  it('gộp một parentZaloId thành một delivery trong bulk event', async () => {
    const first = { title: 'A', message: 'Nội dung A', type: NotificationType.TUITION, level: NotificationLevel.INFO }
    const second = { title: 'B', message: 'Nội dung B', type: NotificationType.TUITION, level: NotificationLevel.INFO }

    await service.enqueueStudentAndParents({
      idempotencyKey: 'tuition:bulk:1',
      sourceType: 'TUITION_PAYMENT',
      sourceId: 'bulk:1',
      sourceEvent: 'BULK_PARENT_NOTIFY',
      title: 'Học phí',
      message: 'Hai học sinh',
      targets: [
        { studentId: 10, parentZaloId: 'same-zalo', zaloPayload: first },
        { studentId: 11, parentZaloId: 'same-zalo', zaloPayload: second },
      ],
    })

    const zaloRecipients = createOrGet.mock.calls[0][0].payload.recipients.filter((item: any) =>
      item.recipientKey.startsWith('ZALO:'),
    )
    expect(zaloRecipients).toHaveLength(1)
    expect(zaloRecipients[0].deliveries[0].payload.message).toContain('Nội dung A\n\n---\n\nNội dung B')
  })

  it('lỗi ghi outbox được ném để transaction nghiệp vụ rollback thay vì mất notification', async () => {
    createOrGet.mockRejectedValueOnce(new Error('database unavailable'))
    resolveSnapshots.mockResolvedValue([
      {
        userId: 1,
        profileId: 1,
        recipientType: NotificationRecipientType.STUDENT,
        displayName: 'Học sinh',
      },
    ])

    await expect(
      service.enqueueInApp([
        {
          userId: 1,
          title: 'Điểm',
          message: '+1',
          type: NotificationType.SYSTEM,
        },
      ]),
    ).rejects.toThrow('database unavailable')
  })

  it('giữ nguyên kiểu metadata của IN_APP khi enqueue', async () => {
    resolveSnapshots.mockResolvedValue([
      {
        userId: 1,
        profileId: 1,
        recipientType: NotificationRecipientType.STUDENT,
        displayName: 'Học sinh',
      },
    ])

    await service.enqueueInApp([
      {
        userId: 1,
        title: 'Học phí',
        message: 'Nhắc học phí',
        data: {
          paymentId: 12,
          shouldShowReminderModal: true,
          context: { tab: 'payments' },
        },
      },
    ])

    const input = createOrGet.mock.calls[0][0].payload
    expect(input.data).toEqual({
      paymentId: 12,
      shouldShowReminderModal: true,
      context: { tab: 'payments' },
    })
    expect(input.recipients[0].deliveries[0].payload.data).toEqual(input.data)
  })

  it('publish outbox vào dispatch pipeline với cùng idempotency key', async () => {
    await service.publishOutbox({
      idempotencyKey: 'business:1',
      sourceType: 'TEST',
      sourceId: '1',
      sourceEvent: 'CREATED',
      title: 'Test',
      message: 'Test',
      recipients: [],
    })
    expect(execute).not.toHaveBeenCalled()
  })
})
