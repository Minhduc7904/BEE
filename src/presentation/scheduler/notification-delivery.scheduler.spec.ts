import { ConflictException } from '@nestjs/common'
import { DispatchNotificationDeliveriesUseCase } from '../../application/use-cases/notification'
import { NotificationDeliveryScheduler } from './notification-delivery.scheduler'

describe('NotificationDeliveryScheduler', () => {
  const executeScheduled = jest.fn()
  const dispatcher = { executeScheduled } as unknown as DispatchNotificationDeliveriesUseCase
  const scheduler = new NotificationDeliveryScheduler(dispatcher)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('chạy dispatcher với worker id ổn định', async () => {
    executeScheduled.mockResolvedValue(null)

    await scheduler.dispatch()

    expect(executeScheduled).toHaveBeenCalledWith('SCHEDULER:NOTIFICATION_DELIVERY_DISPATCHER')
  })

  it('bỏ qua khi một worker khác đang giữ lock', async () => {
    executeScheduled.mockRejectedValue(new ConflictException('NOTIFICATION_DELIVERY_DISPATCHER_ALREADY_RUNNING'))

    await expect(scheduler.dispatch()).resolves.toBeUndefined()
  })
})
