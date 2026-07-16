/** Application port and Nest injection token for NotificationRealtimeService. */
export abstract class NotificationRealtimeService {}

export interface NotificationRealtimeService {
  notifyUser(...args: any[]): any
  notifyStatsUpdated(...args: any[]): any
}

