/** Application port and Nest injection token for StatusRealtimeService. */
export abstract class StatusRealtimeService {}

export interface StatusRealtimeService {
  emitUserStatus(...args: any[]): any
  emitOnlineStats(...args: any[]): any
  getStats(...args: any[]): any
  isUserOnline(...args: any[]): any
}

