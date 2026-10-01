import { NotificationDelivery } from '../../../domain/entities/notification'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotificationDeliveryChannel, NotificationDeliveryStatus } from '../../../shared/enums'
import type { NotificationRealtimeService, PushNotificationService } from '../../interfaces'
import type { ZaloService } from '../../interfaces'
import { DispatchNotificationDeliveriesUseCase } from './dispatch-notification-deliveries.use-case'
import type { PushNotificationEligibilityService } from './push-notification-eligibility.service'
import type { GetValidZaloAccessTokenUseCase } from '../zalo/get-valid-zalo-access-token.use-case'

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
  const findDevices = jest.fn()
  const deleteDevices = jest.fn()
  const findNotification = jest.fn()
  const repos = {
    notificationRepository: {
      createForDispatchRecipient: createNotification,
      findByDispatchRecipientId: findNotification,
      getStatsByUserId: jest.fn().mockResolvedValue({ total: 1, unread: 1, read: 0 }),
    },
    notificationDeliveryRepository: { update: updateDelivery },
    userDeviceRepository: { findByUserIds: findDevices, deleteByTokens: deleteDevices },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn((callback) => callback(repos)),
  } as unknown as IUnitOfWork
  const realtimeService = { notifyUser, notifyStatsUpdated: jest.fn() } as unknown as NotificationRealtimeService
  const pushService = { sendToTokens: jest.fn() } as unknown as PushNotificationService
  const evaluatePushEligibility = jest.fn()
  const pushEligibility = {
    evaluate: evaluatePushEligibility,
  } as unknown as PushNotificationEligibilityService
  const sendZaloMessage = jest.fn()
  const zaloService = { sendMessage: sendZaloMessage } as unknown as ZaloService
  const getValidZaloAccessToken = { execute: jest.fn().mockResolvedValue('token') } as unknown as GetValidZaloAccessTokenUseCase
  const useCase = new DispatchNotificationDeliveriesUseCase(unitOfWork, realtimeService, pushService, pushEligibility, zaloService, getValidZaloAccessToken)
  const harness = useCase as unknown as DispatcherHarness

  const delivery = new NotificationDelivery({
    notificationDeliveryId: 11,
    notificationDispatchRecipientId: 21,
    channel: NotificationDeliveryChannel.IN_APP,
    status: NotificationDeliveryStatus.PROCESSING,
    attemptCount: 1,
    maxAttempts: 3,
    availableAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    recipient: { userId: 31 },
    job: {
      notificationDispatchJobId: 1,
      title: 'Thông báo',
      message: 'Nội dung',
      type: 'SYSTEM',
      level: 'INFO',
      data: { shouldShowReminderModal: true },
    },
  } as unknown as ConstructorParameters<typeof NotificationDelivery>[0])

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
    expect(createNotification).toHaveBeenCalledWith(
      delivery.notificationDispatchRecipientId,
      expect.objectContaining({ data: { shouldShowReminderModal: true } }),
    )
    expect(updateDelivery).toHaveBeenCalledWith(
      delivery.notificationDeliveryId,
      expect.objectContaining({
        status: NotificationDeliveryStatus.SENT,
      }),
    )
    expect(notifyUser).toHaveBeenCalledWith(delivery.recipient!.userId, notification)
  })

  it('chỉ bỏ qua PUSH khi policy không cho phép', async () => {
    const pushDelivery = new NotificationDelivery({ ...delivery, channel: NotificationDeliveryChannel.PUSH })
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

  it('chỉ stringify metadata tại boundary gửi PUSH', async () => {
    const pushDelivery = new NotificationDelivery({
      ...delivery,
      channel: NotificationDeliveryChannel.PUSH,
      payload: {
        title: 'Nhắc học phí',
        message: 'Nội dung',
        type: 'TUITION' as any,
        level: 'INFO' as any,
        data: {
          paymentId: 12,
          shouldShowReminderModal: true,
          context: { tab: 'payments' },
        },
      },
    })
    evaluatePushEligibility.mockResolvedValue({ allowed: true })
    findDevices.mockResolvedValue([{ fcmToken: 'token-1' }])
    findNotification.mockResolvedValue({ notificationId: 41 })
    ;(pushService.sendToTokens as jest.Mock).mockResolvedValue({
      providerAvailable: true,
      successCount: 1,
      failureCount: 0,
      invalidTokens: [],
      outcomes: [{ token: 'token-1', success: true, messageId: 'message-1', retryable: false }],
    })
    updateDelivery.mockResolvedValue(pushDelivery)

    await expect(harness.process(pushDelivery)).resolves.toBe('sent')

    expect(pushService.sendToTokens).toHaveBeenCalledWith(['token-1'], expect.objectContaining({
      data: {
        paymentId: '12',
        shouldShowReminderModal: 'true',
        context: '{"tab":"payments"}',
        notificationDispatchJobId: '1',
        notificationId: '41',
      },
    }))
  })

  it('chỉ retry token lỗi tạm thời sau multi-device partial success', async () => {
    const firstAttempt = new NotificationDelivery({
      ...delivery,
      notificationDeliveryId: 22,
      channel: NotificationDeliveryChannel.PUSH,
    })
    const retryAttempt = new NotificationDelivery({
      ...delivery,
      notificationDeliveryId: 22,
      channel: NotificationDeliveryChannel.PUSH,
      attemptCount: 2,
      pendingPushTokens: ['token-2'],
    })
    evaluatePushEligibility.mockResolvedValue({ allowed: true })
    findDevices.mockResolvedValue([{ fcmToken: 'token-1' }, { fcmToken: 'token-2' }])
    findNotification.mockResolvedValue(null)
    ;(pushService.sendToTokens as jest.Mock)
      .mockResolvedValueOnce({
        providerAvailable: true,
        successCount: 1,
        failureCount: 1,
        invalidTokens: [],
        outcomes: [
          { token: 'token-1', success: true, messageId: 'message-1', retryable: false },
          { token: 'token-2', success: false, errorCode: 'messaging/server-unavailable', retryable: true },
        ],
      })
      .mockResolvedValueOnce({
        providerAvailable: true,
        successCount: 1,
        failureCount: 0,
        invalidTokens: [],
        outcomes: [{ token: 'token-2', success: true, messageId: 'message-2', retryable: false }],
      })
    updateDelivery.mockResolvedValue(firstAttempt)

    await expect(harness.process(firstAttempt)).resolves.toBe('retried')
    expect(pushService.sendToTokens).toHaveBeenNthCalledWith(1, ['token-1', 'token-2'], expect.any(Object))
    expect(updateDelivery).toHaveBeenLastCalledWith(firstAttempt.notificationDeliveryId, expect.objectContaining({
      status: NotificationDeliveryStatus.RETRY_WAIT,
      pendingPushTokens: ['token-2'],
    }))

    updateDelivery.mockResolvedValue(retryAttempt)
    await expect(harness.process(retryAttempt)).resolves.toBe('sent')
    expect(pushService.sendToTokens).toHaveBeenNthCalledWith(2, ['token-2'], expect.any(Object))
    expect(updateDelivery).toHaveBeenLastCalledWith(retryAttempt.notificationDeliveryId, expect.objectContaining({
      status: NotificationDeliveryStatus.SENT,
      pendingPushTokens: null,
    }))
  })

  it('không đánh dấu SENT khi một thiết bị bị FCM từ chối vĩnh viễn', async () => {
    const pushDelivery = new NotificationDelivery({
      ...delivery,
      notificationDeliveryId: 23,
      channel: NotificationDeliveryChannel.PUSH,
    })
    evaluatePushEligibility.mockResolvedValue({ allowed: true })
    findDevices.mockResolvedValue([{ fcmToken: 'token-1' }, { fcmToken: 'token-2' }])
    findNotification.mockResolvedValue(null)
    ;(pushService.sendToTokens as jest.Mock).mockResolvedValue({
      providerAvailable: true,
      successCount: 1,
      failureCount: 1,
      invalidTokens: [],
      outcomes: [
        { token: 'token-1', success: true, messageId: 'message-1', retryable: false },
        { token: 'token-2', success: false, errorCode: 'messaging/sender-id-mismatch', retryable: false },
      ],
    })
    updateDelivery.mockResolvedValue(pushDelivery)

    await expect(harness.process(pushDelivery)).resolves.toBe('dead')
    expect(updateDelivery).toHaveBeenLastCalledWith(pushDelivery.notificationDeliveryId, expect.objectContaining({
      status: NotificationDeliveryStatus.DEAD,
      pendingPushTokens: null,
      lastErrorCode: 'messaging/sender-id-mismatch',
    }))
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
    const inApp = new NotificationDelivery({ ...delivery, notificationDeliveryId: 12, channel: NotificationDeliveryChannel.IN_APP })
    const push = new NotificationDelivery({ ...delivery, notificationDeliveryId: 13, channel: NotificationDeliveryChannel.PUSH })
    const order: NotificationDeliveryChannel[] = []
    const processSpy = jest.spyOn(harness, 'process').mockImplementation((item) => {
      order.push(item.channel)
      return Promise.resolve('sent')
    })

    await expect(harness.processWithConcurrency([push, inApp], 10)).resolves.toEqual(['sent', 'sent'])

    expect(order).toEqual([NotificationDeliveryChannel.IN_APP, NotificationDeliveryChannel.PUSH])
    processSpy.mockRestore()
  })

  it('ZALO_OA không cần userId và retry bằng state machine chung', async () => {
    const zalo = new NotificationDelivery({
      ...delivery,
      notificationDeliveryId: 14,
      channel: NotificationDeliveryChannel.ZALO_OA,
      destination: 'zalo-user-1',
      recipient: { userId: undefined } as any,
    })
    sendZaloMessage.mockRejectedValueOnce({ response: { status: 429, data: { message: 'rate limited' } } })

    await expect(harness.process(zalo)).resolves.toBe('retried')

    expect(evaluatePushEligibility).not.toHaveBeenCalled()
    expect(updateDelivery).toHaveBeenCalledWith(zalo.notificationDeliveryId, expect.objectContaining({
      status: NotificationDeliveryStatus.RETRY_WAIT,
      lastErrorCode: 'ZALO_RATE_LIMITED',
    }))
  })

  it('bỏ qua ZALO_OA khi không có destination', async () => {
    const zalo = new NotificationDelivery({
      ...delivery,
      notificationDeliveryId: 15,
      channel: NotificationDeliveryChannel.ZALO_OA,
      recipient: { userId: undefined } as any,
    })

    await expect(harness.process(zalo)).resolves.toBe('skipped')
    expect(updateDelivery).toHaveBeenCalledWith(zalo.notificationDeliveryId, expect.objectContaining({
      status: NotificationDeliveryStatus.SKIPPED,
      skipReason: 'NO_ZALO_RECIPIENT_ID',
    }))
  })

  it('chuyển ZALO_OA sang DEAD sau lần thử thứ ba', async () => {
    const zalo = new NotificationDelivery({
      ...delivery,
      notificationDeliveryId: 16,
      channel: NotificationDeliveryChannel.ZALO_OA,
      destination: 'zalo-user-2',
      attemptCount: 3,
      maxAttempts: 3,
      recipient: { userId: undefined } as any,
    })
    sendZaloMessage.mockRejectedValueOnce(new Error('network timeout'))

    await expect(harness.process(zalo)).resolves.toBe('dead')
    expect(updateDelivery).toHaveBeenCalledWith(zalo.notificationDeliveryId, expect.objectContaining({
      status: NotificationDeliveryStatus.DEAD,
      lastErrorCode: 'ZALO_SEND_FAILED',
    }))
  })
})
