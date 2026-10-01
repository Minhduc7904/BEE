import type { NotificationRealtimeService as NotificationRealtimeServicePort } from 'src/application/interfaces/notification-realtime.interface'
// src/infrastructure/services/notification/notification-realtime.service.ts
import { Injectable } from '@nestjs/common'
import { SocketService } from '../socket/socket.service'
import { SOCKET_EVENTS } from 'src/shared/constants/socket-events.constant'
import type { NotificationChangedEventInput } from '../../../application/interfaces'
import { NotificationChangeReason } from '../../../shared/enums'

@Injectable()
export class NotificationRealtimeService {
  constructor(private readonly socketService: SocketService) {}

  notifyUser(userId: number, notification: any) {
    this.socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION.NEW, { notification })
    this.notifyChanged(userId, {
      reason: NotificationChangeReason.CREATED,
      notificationId: notification?.notificationId,
    })
  }

  notifyStatsUpdated(
    userId: number,
    stats: {
      total: number
      unread: number
      read: number
    },
  ) {
    this.socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION.STATS_UPDATED, stats)
  }

  notifyNotificationRead(userId: number, notification: any) {
    this.socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION.READ, { notification })
    this.notifyChanged(userId, {
      reason: NotificationChangeReason.READ,
      notificationId: notification?.notificationId,
    })
  }

  notifyAllNotificationsRead(userId: number) {
    this.socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION.READ, { all: true })
    this.notifyChanged(userId, { reason: NotificationChangeReason.READ_ALL })
  }

  notifyNotificationDeleted(userId: number, notificationId: number) {
    this.socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION.DELETED, { notificationId })
    this.notifyChanged(userId, { reason: NotificationChangeReason.DELETED, notificationId })
  }

  notifyChanged(userId: number, change: NotificationChangedEventInput) {
    this.socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION.CHANGED, {
      version: 1,
      reason: change.reason,
      ...(change.notificationId ? { notificationId: change.notificationId } : {}),
      occurredAt: new Date().toISOString(),
    })
  }
}
