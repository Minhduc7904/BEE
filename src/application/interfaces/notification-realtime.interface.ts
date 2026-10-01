/** Application port and Nest injection token for NotificationRealtimeService. */
export abstract class NotificationRealtimeService {}

export interface NotificationRealtimeService {
  notifyUser(...args: any[]): any
  notifyStatsUpdated(...args: any[]): any
  notifyNotificationRead(...args: any[]): any
  notifyAllNotificationsRead(...args: any[]): any
  notifyNotificationDeleted(...args: any[]): any
}
