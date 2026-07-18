/** Application port and Nest injection token for SocketService. */
export abstract class SocketService {}

export interface SocketService {
  setServer(...args: any[]): any
  getServer(...args: any[]): any
  emitToUser(...args: any[]): any
  emitToRoom(...args: any[]): any
  broadcast(...args: any[]): any
  joinRoom(...args: any[]): any
  leaveRoom(...args: any[]): any
  getSocketRooms(...args: any[]): any
  getRoomSize(...args: any[]): any
  isUserOnline(...args: any[]): any
  getConnectedClientsCount(...args: any[]): any
  getOnlineUserCount(...args: any[]): any
  getOnlineUserIds(...args: any[]): any
  getOnlineUsersByType(...args: any[]): any
  getOnlineUsersStats(...args: any[]): any
}

