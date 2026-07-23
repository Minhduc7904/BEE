import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

import { SocketAuthService } from '../../infrastructure/services/socket/socket-auth.service'
import { SocketRoomService } from '../../infrastructure/services/socket/socket-room.service'
import { SocketService } from '../../infrastructure/services/socket/socket.service'
import { BaseGateway } from './base.gateway'

/**
 * Owns the root namespace connection lifecycle exactly once.
 * Feature gateways inherit only BaseGateway helpers and therefore do not add
 * duplicate Socket.IO disconnect listeners.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class SocketLifecycleGateway extends BaseGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    socketService: SocketService,
    socketAuthService: SocketAuthService,
    socketRoomService: SocketRoomService,
  ) {
    super(socketService, socketAuthService, socketRoomService)
  }

  afterInit(server: Server): void {
    this.socketService.setServer(server)
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.socketAuthService.extractTokenFromHandshake(client.handshake)
      if (!token) {
        client.emit('error', { message: 'Authentication required' })
        client.disconnect()
        return
      }

      const user = await this.socketAuthService.validateToken(token)
      client.data.user = user
      this.socketRoomService.joinUserRoom(client, user.userId)

      for (const role of user.roles ?? []) {
        if (role?.name) this.socketRoomService.joinRoleRoom(client, role.name)
      }
      if (user.userType) this.socketRoomService.joinRoleRoom(client, user.userType)

      client.emit('connected', {
        message: 'Connected to WebSocket server',
        userId: user.userId,
        timestamp: new Date().toISOString(),
      })
      setImmediate(() => this.broadcastOnlineStats())
    } catch {
      client.emit('error', { message: 'Authentication failed' })
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data.user
    if (user && !this.socketService.isUserOnline(user.userId)) {
      setImmediate(() => this.broadcastOnlineStats())
    }
  }
}
