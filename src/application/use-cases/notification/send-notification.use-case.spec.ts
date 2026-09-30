import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import {
  AuditStatus,
  NotificationDeliveryChannel,
  NotificationDispatchJobStatus,
  NotificationLevel,
  NotificationType,
} from '../../../shared/enums'
import type { EnqueueNotificationDispatchJobUseCase } from './enqueue-notification-dispatch-job.use-case'
import { SendNotificationUseCase } from './send-notification.use-case'

describe('SendNotificationUseCase', () => {
  const filterActiveUserIds = jest.fn()
  const createAuditLog = jest.fn()
  const enqueue = jest.fn()
  const findByIdempotencyKey = jest.fn()
  const repos = {
    userRepository: { filterActiveUserIds },
    adminAuditLogRepository: { create: createAuditLog },
    notificationDispatchJobRepository: { findByIdempotencyKey },
  }
  const executeInTransaction = jest.fn((callback) => callback(repos))
  const unitOfWork = { executeInTransaction } as unknown as IUnitOfWork
  const enqueueUseCase = { executeWithRepos: enqueue } as unknown as EnqueueNotificationDispatchJobUseCase
  const useCase = new SendNotificationUseCase(unitOfWork, enqueueUseCase)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('xếp notification admin vào cả IN_APP và PUSH rồi ghi audit theo job', async () => {
    filterActiveUserIds.mockResolvedValue([1, 2])
    enqueue.mockResolvedValue({
      notificationDispatchJobId: 51,
      recipientCount: 2,
      deliveryCount: 4,
      reused: false,
      status: NotificationDispatchJobStatus.QUEUED,
      sentDeliveryCount: 0,
      skippedDeliveryCount: 0,
      deadDeliveryCount: 0,
    })

    const result = await useCase.execute(
      {
        userIds: [1, 2, 999],
        title: 'Thông báo',
        message: 'Nội dung',
        type: NotificationType.SYSTEM,
        level: NotificationLevel.INFO,
        data: { courseId: 12, action: 'view' },
      },
      7,
      'request-51',
    )

    expect(enqueue).toHaveBeenCalledWith(
      repos,
      expect.objectContaining({
        idempotencyKey: 'request-51',
        userIds: [1, 2],
        channels: [NotificationDeliveryChannel.IN_APP, NotificationDeliveryChannel.PUSH],
        data: { courseId: '12', action: 'view' },
        createdByAdminId: 7,
      }),
    )
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionKey: ACTION_KEYS.NOTIFICATION.SEND,
        resourceType: RESOURCE_TYPES.NOTIFICATION,
        resourceId: '51',
        status: AuditStatus.SUCCESS,
      }),
    )
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Đã xếp hàng thông báo',
        data: {
          jobId: 51,
          status: NotificationDispatchJobStatus.QUEUED,
          recipientCount: 2,
          totalDeliveryCount: 4,
          reused: false,
          sentDeliveryCount: 0,
          skippedDeliveryCount: 0,
          deadDeliveryCount: 0,
        },
      }),
    )
  })

  it('trả lỗi khi audit thất bại để transaction rollback enqueue', async () => {
    filterActiveUserIds.mockResolvedValue([1])
    enqueue.mockResolvedValue({
      notificationDispatchJobId: 52,
      recipientCount: 1,
      deliveryCount: 1,
      reused: false,
      status: NotificationDispatchJobStatus.QUEUED,
      sentDeliveryCount: 0,
      skippedDeliveryCount: 0,
      deadDeliveryCount: 0,
    })
    createAuditLog.mockRejectedValue(new Error('audit unavailable'))

    await expect(
      useCase.execute({ userIds: [1], title: 'Thông báo', message: 'Nội dung' }, 7, 'request-52'),
    ).rejects.toThrow('audit unavailable')
    expect(executeInTransaction).toHaveBeenCalledTimes(1)
  })

  it('đọc lại job khi hai request cùng idempotency key bị unique race', async () => {
    filterActiveUserIds.mockResolvedValue([1])
    enqueue.mockRejectedValue({ code: 'P2002' })
    findByIdempotencyKey.mockResolvedValue({
      notificationDispatchJobId: 53,
      status: NotificationDispatchJobStatus.PROCESSING,
      recipientCount: 1,
      totalDeliveryCount: 2,
      sentDeliveryCount: 1,
      skippedDeliveryCount: 1,
      deadDeliveryCount: 0,
    })

    const result = await useCase.execute({ userIds: [1], title: 'Thông báo', message: 'Nội dung' }, 7, 'request-53')

    expect(result.data).toEqual({
      jobId: 53,
      status: NotificationDispatchJobStatus.PROCESSING,
      recipientCount: 1,
      totalDeliveryCount: 2,
      reused: true,
      sentDeliveryCount: 1,
      skippedDeliveryCount: 1,
      deadDeliveryCount: 0,
    })
  })

  it('không cho Admin gửi thủ công qua ZALO_OA', async () => {
    await expect(useCase.execute({
      userIds: [1],
      title: 'Thông báo',
      message: 'Nội dung',
      channels: [NotificationDeliveryChannel.ZALO_OA],
    }, 7, 'request-zalo')).rejects.toMatchObject({ status: 400 })

    expect(enqueue).not.toHaveBeenCalled()
  })
})
