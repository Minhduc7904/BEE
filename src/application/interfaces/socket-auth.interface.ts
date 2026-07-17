/** Application port and Nest injection token for SocketAuthService. */
export abstract class SocketAuthService {}

export interface SocketAuthService {
  validateToken(...args: any[]): any
  extractTokenFromHandshake(...args: any[]): any
}

