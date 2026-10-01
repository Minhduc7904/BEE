import { SOCKET_EVENTS } from 'src/shared/constants/socket-events.constant'
import { NotificationRealtimeService } from './notification-realtime.service'
import { NotificationChangeReason } from '../../../shared/enums'

describe('NotificationRealtimeService', () => {
  it('giữ event cũ và phát invalidation không chứa nội dung nhạy cảm', () => {
    const emitToUser = jest.fn()
    const service = new NotificationRealtimeService({ emitToUser } as any)
    const notification = { notificationId: 42, isRead: true }
    const stats = { total: 3, unread: 1, read: 2 }

    service.notifyUser(7, notification)
    service.notifyNotificationRead(7, notification)
    service.notifyAllNotificationsRead(7)
    service.notifyNotificationDeleted(7, 42)
    service.notifyStatsUpdated(7, stats)

    expect(emitToUser).toHaveBeenNthCalledWith(1, 7, SOCKET_EVENTS.NOTIFICATION.NEW, { notification })
    expect(emitToUser).toHaveBeenNthCalledWith(
      2,
      7,
      SOCKET_EVENTS.NOTIFICATION.CHANGED,
      expect.objectContaining({ version: 1, reason: NotificationChangeReason.CREATED, notificationId: 42 }),
    )
    expect(emitToUser).toHaveBeenNthCalledWith(3, 7, SOCKET_EVENTS.NOTIFICATION.READ, { notification })
    expect(emitToUser).toHaveBeenNthCalledWith(
      4,
      7,
      SOCKET_EVENTS.NOTIFICATION.CHANGED,
      expect.objectContaining({ version: 1, reason: NotificationChangeReason.READ, notificationId: 42 }),
    )
    expect(emitToUser).toHaveBeenNthCalledWith(5, 7, SOCKET_EVENTS.NOTIFICATION.READ, { all: true })
    expect(emitToUser).toHaveBeenNthCalledWith(
      6,
      7,
      SOCKET_EVENTS.NOTIFICATION.CHANGED,
      expect.objectContaining({ version: 1, reason: NotificationChangeReason.READ_ALL }),
    )
    expect(emitToUser).toHaveBeenNthCalledWith(7, 7, SOCKET_EVENTS.NOTIFICATION.DELETED, { notificationId: 42 })
    expect(emitToUser).toHaveBeenNthCalledWith(
      8,
      7,
      SOCKET_EVENTS.NOTIFICATION.CHANGED,
      expect.objectContaining({ version: 1, reason: NotificationChangeReason.DELETED, notificationId: 42 }),
    )
    expect(emitToUser).toHaveBeenNthCalledWith(9, 7, SOCKET_EVENTS.NOTIFICATION.STATS_UPDATED, stats)
    const invalidations = emitToUser.mock.calls.filter((call) => call[1] === SOCKET_EVENTS.NOTIFICATION.CHANGED)
    expect(invalidations.every((call) => !('notification' in call[2]) && !('title' in call[2]))).toBe(true)
  })
})
