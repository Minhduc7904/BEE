import type { NotificationDelivery } from '../../../domain/entities/notification'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotificationDeliveryChannel, NotificationDeliveryStatus } from '../../../shared/enums'
import type { NotificationRealtimeService, PushNotificationService } from '../../interfaces'
import { DispatchNotificationDeliveriesUseCase } from './dispatch-notification-deliveries.use-case'
import type { PushNotificationEligibilityService } from './push-notification-eligibility.service'

type DispatcherHarness = {
  process(delivery: NotificationDelivery): Promise<'sent' | 'skipped' | 'retried' | 'dead'>
  processInApp(delivery: NotificationDelivery): Promise<'sent'>
  processWithConcurrency(
    deliveries: NotificationDelivery[],
    concurrency: number,
  ): Promise<Array<'sent' | 'skipped' | 'retried' | 'dead'>>
}

describe('DispatchNotificationDeliveriesUseCase', () => {
  const createNotification = jest.fn()
  const updateDelivery = jest.fn()
  const notifyUser = jest.fn()
  const repos = {
    notificationRepository: { createForDispatchRecipient: createNotification },
    notificationDeliveryRepository: { update: updateDelivery },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn((callback) => callback(repos)),
  } as unknown as IUnitOfWork
  const realtimeService = { notifyUser } as unknown as NotificationRealtimeService
  const pushService = { sendToTokens: jest.fn() } as unknown as PushNotificationService
  const evaluatePushEligibility = jest.fn()
  const pushEligibility = {
    evaluate: evaluatePushEligibility,
  } as unknown as PushNotificationEligibilityService
  const useCase = new DispatchNotificationDeliveriesUseCase(unitOfWork, realtimeService, pushService, pushEligibility)
  const harness = useCase as unknown as DispatcherHarness

  const delivery = {
    notificationDeliveryId: 11,
    notificationDispatchRecipientId: 21,
    channel: NotificationDeliveryChannel.IN_APP,
    recipient: { userId: 31 },
    job: {
      title: 'Thông báo',
      message: 'Nội dung',
      type: 'SYSTEM',
      level: 'INFO',
    },
  } as NotificationDelivery

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('luôn lưu IN_APP và phát realtime mà không kiểm tra PUSH setting', async () => {
    const notification = { notificationId: 41 }
    createNotification.mockResolvedValue(notification)
    updateDelivery.mockResolvedValue(delivery)

    await expect(harness.process(delivery)).resolves.toBe('sent')

    expect(evaluatePushEligibility).not.toHaveBeenCalled()
    expect(createNotification).toHaveBeenCalledTimes(1)
    expect(updateDelivery).toHaveBeenCalledWith(
      delivery.notificationDeliveryId,
      expect.objectContaining({
        status: NotificationDeliveryStatus.SENT,
      }),
    )
    expect(notifyUser).toHaveBeenCalledWith(delivery.recipient!.userId, notification)
  })

  it('chỉ bỏ qua PUSH khi policy không cho phép', async () => {
    const pushDelivery = { ...delivery, channel: NotificationDeliveryChannel.PUSH }
    evaluatePushEligibility.mockResolvedValue({
      allowed: false,
      skipReason: 'PARENT_ATTENDANCE_NOTIFICATION_DISABLED',
    })
    updateDelivery.mockResolvedValue(pushDelivery)

    await expect(harness.process(pushDelivery)).resolves.toBe('skipped')

    expect(updateDelivery).toHaveBeenCalledWith(
      pushDelivery.notificationDeliveryId,
      expect.objectContaining({
        status: NotificationDeliveryStatus.SKIPPED,
        skipReason: 'PARENT_ATTENDANCE_NOTIFICATION_DISABLED',
      }),
    )
    expect(createNotification).not.toHaveBeenCalled()
  })

  it('lưu notification và đánh dấu SENT trong cùng transaction trước khi phát realtime', async () => {
    const notification = { notificationId: 41 }
    createNotification.mockResolvedValue(notification)
    updateDelivery.mockResolvedValue(delivery)

    await expect(harness.processInApp(delivery)).resolves.toBe('sent')

    expect(createNotification).toHaveBeenCalledTimes(1)
    expect(updateDelivery).toHaveBeenCalledWith(
      delivery.notificationDeliveryId,
      expect.objectContaining({ status: NotificationDeliveryStatus.SENT }),
    )
    expect(updateDelivery.mock.invocationCallOrder[0]).toBeLessThan(notifyUser.mock.invocationCallOrder[0])
  })

  it('xử lý toàn bộ IN_APP trước PUSH để PUSH lấy được notificationId đã lưu', async () => {
    const inApp = { ...delivery, notificationDeliveryId: 12, channel: NotificationDeliveryChannel.IN_APP }
    const push = { ...delivery, notificationDeliveryId: 13, channel: NotificationDeliveryChannel.PUSH }
    const order: NotificationDeliveryChannel[] = []
    const processSpy = jest.spyOn(harness, 'process').mockImplementation((item) => {
      order.push(item.channel)
      return Promise.resolve('sent')
    })

    await expect(harness.processWithConcurrency([push, inApp], 10)).resolves.toEqual(['sent', 'sent'])

    expect(order).toEqual([NotificationDeliveryChannel.IN_APP, NotificationDeliveryChannel.PUSH])
    processSpy.mockRestore()
  })
})
