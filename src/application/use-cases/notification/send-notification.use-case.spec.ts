import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus, NotificationDeliveryChannel, NotificationLevel, NotificationType } from '../../../shared/enums'
import type { EnqueueNotificationDispatchJobUseCase } from './enqueue-notification-dispatch-job.use-case'
import { SendNotificationUseCase } from './send-notification.use-case'

describe('SendNotificationUseCase', () => {
  const filterActiveUserIds = jest.fn()
  const createAuditLog = jest.fn()
  const enqueue = jest.fn()
  const repos = {
    userRepository: { filterActiveUserIds },
    adminAuditLogRepository: { create: createAuditLog },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn((callback) => callback(repos)),
  } as unknown as IUnitOfWork
  const enqueueUseCase = { execute: enqueue } as unknown as EnqueueNotificationDispatchJobUseCase
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
    )

    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: expect.stringMatching(/^admin-notification:7:/),
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
        message: 'Đã xếp hàng 2 thông báo',
        data: { count: 2 },
      }),
    )
  })
})
