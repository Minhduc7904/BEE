import { SOCKET_EVENTS } from 'src/shared/constants/socket-events.constant'
import { NotificationRealtimeService } from './notification-realtime.service'

describe('NotificationRealtimeService', () => {
  it('emits read, delete, and stats updates to the authenticated user room', () => {
    const emitToUser = jest.fn()
    const service = new NotificationRealtimeService({ emitToUser } as any)
    const notification = { notificationId: 42, isRead: true }
    const stats = { total: 3, unread: 1, read: 2 }

    service.notifyNotificationRead(7, notification)
    service.notifyAllNotificationsRead(7)
    service.notifyNotificationDeleted(7, 42)
    service.notifyStatsUpdated(7, stats)

    expect(emitToUser).toHaveBeenNthCalledWith(1, 7, SOCKET_EVENTS.NOTIFICATION.READ, { notification })
    expect(emitToUser).toHaveBeenNthCalledWith(2, 7, SOCKET_EVENTS.NOTIFICATION.READ, { all: true })
    expect(emitToUser).toHaveBeenNthCalledWith(3, 7, SOCKET_EVENTS.NOTIFICATION.DELETED, { notificationId: 42 })
    expect(emitToUser).toHaveBeenNthCalledWith(4, 7, SOCKET_EVENTS.NOTIFICATION.STATS_UPDATED, stats)
  })
})
