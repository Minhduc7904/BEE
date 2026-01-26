// src/presentation/gateways/status.gateway.ts
import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { BaseGateway } from './base.gateway'
import { SocketAuthService } from '../../infrastructure/services/socket/socket-auth.service'
import { SocketService } from '../../infrastructure/services/socket/socket.service'
import { SocketRoomService } from '../../infrastructure/services/socket/socket-room.service'
import { StatusRealtimeService } from 'src/infrastructure/services/socket/status-realtime.service'

/**
 * StatusGateway
 * 
 * WebSocket gateway for user online status and statistics.
 * Handles checking user online status and getting online users stats.
 * Uses root namespace.
 * 
 * @layer Presentation
 * @endpoint ws://localhost:3000/
 */
// src/presentation/gateways/status.gateway.ts
@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
})
export class StatusGateway extends BaseGateway {
    constructor(
        socketService: SocketService,
        socketAuthService: SocketAuthService,
        socketRoomService: SocketRoomService,
        private readonly statusRealtimeService: StatusRealtimeService,
    ) {
        super(socketService, socketAuthService, socketRoomService)
    }

    @SubscribeMessage('check-user-status')
    handleCheckUserStatus(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: number }
    ) {
        if (!data.userId) {
            this.emitError(client, 'User ID is required', 'INVALID_USER_ID')
            return
        }

        const isOnline = this.statusRealtimeService.isUserOnline(data.userId)

        this.emitSuccess(client, 'user-status', {
            userId: data.userId,
            isOnline,
            timestamp: new Date().toISOString(),
        })
    }

    @SubscribeMessage('get-online-stats')
    handleGetOnlineStats(@ConnectedSocket() client: Socket) {
        const stats = this.statusRealtimeService.getStats()

        this.emitSuccess(client, 'online-stats', {
            ...stats,
            timestamp: new Date().toISOString(),
        })
    }

    @SubscribeMessage('subscribe-status-updates')
    handleSubscribe(@ConnectedSocket() client: Socket) {
        this.socketService.joinRoom(client, 'status-updates')
        this.emitSuccess(client, 'subscribed-status-updates', {})
    }

    @SubscribeMessage('unsubscribe-status-updates')
    handleUnsubscribe(@ConnectedSocket() client: Socket) {
        this.socketService.leaveRoom(client, 'status-updates')
        this.emitSuccess(client, 'unsubscribed-status-updates', {})
    }
}
