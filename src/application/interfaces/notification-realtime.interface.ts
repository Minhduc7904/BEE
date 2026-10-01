import type { NotificationChangeReason } from '../../shared/enums'

export interface NotificationChangedEventInput {
  reason: NotificationChangeReason
  notificationId?: number
}

/** Application port and Nest injection token for NotificationRealtimeService. */
export abstract class NotificationRealtimeService {
  abstract notifyUser(...args: any[]): any
  abstract notifyStatsUpdated(...args: any[]): any
  abstract notifyNotificationRead(...args: any[]): any
  abstract notifyAllNotificationsRead(...args: any[]): any
  abstract notifyNotificationDeleted(...args: any[]): any
  abstract notifyChanged(userId: number, change: NotificationChangedEventInput): void
}
