// src/presentation/gateways/notification.gateway.ts
import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets'
import { UseGuards } from '@nestjs/common'
import { Socket } from 'socket.io'
import { BaseGateway } from './base.gateway'
import { SocketAuthService } from '../../infrastructure/services/socket/socket-auth.service'
import { SocketService } from '../../infrastructure/services/socket/socket.service'
import { SocketRoomService } from '../../infrastructure/services/socket/socket-room.service'
import { RequireWsPermissions } from '../../shared/decorators/ws-permissions.decorator'
import { WsPermissionsGuard } from '../../shared/guards/ws-permissions.guard'
import {
    MarkNotificationReadUseCase,
    DeleteNotificationUseCase,
} from '../../application/use-cases/notification'

/**
 * NotificationGateway
 * 
 * WebSocket gateway for real-time notifications.
 * Handles notification events, room management, and broadcasting.
 * Supports marking notifications as read and deleting via WebSocket.
 * Uses root namespace with room-based routing.
 * 
 * @layer Presentation
 * @endpoint ws://localhost:3000/
 */
@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
})
export class NotificationGateway extends BaseGateway {
    constructor(
        socketService: SocketService,
        socketAuthService: SocketAuthService,
        socketRoomService: SocketRoomService,
        private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
        private readonly deleteNotificationUseCase: DeleteNotificationUseCase,
    ) {
        super(socketService, socketAuthService, socketRoomService)
    }

    /**
     * Client requests to join a notification room
     * Example: Join room for course notifications
     */
    @SubscribeMessage('join-room')
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string }
    ) {
        const user = this.getUser(client)

        if (!data.roomId) {
            this.emitError(client, 'Room ID is required', 'INVALID_ROOM_ID')
            return
        }

        this.socketService.joinRoom(client, data.roomId)

        this.emitSuccess(client, 'room-joined', {
            roomId: data.roomId,
            userId: user.userId,
            message: `Joined room: ${data.roomId}`,
        })
    }

    /**
     * Client requests to leave a notification room
     */
    @SubscribeMessage('leave-room')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string }
    ) {
        if (!data.roomId) {
            this.emitError(client, 'Room ID is required', 'INVALID_ROOM_ID')
            return
        }

        this.socketService.leaveRoom(client, data.roomId)

        this.emitSuccess(client, 'room-left', {
            roomId: data.roomId,
            message: `Left room: ${data.roomId}`,
        })
    }

    /**
     * Client marks notification as read
     * Calls MarkNotificationReadUseCase and broadcasts update
     */
    @UseGuards(WsPermissionsGuard)
    @RequireWsPermissions('NOTIFICATION_MANAGE')
    @SubscribeMessage('mark-notification-read')
    async handleMarkAsRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { notificationId: number }
    ) {
        const user = this.getUser(client)

        if (!data.notificationId) {
            this.emitError(client, 'Notification ID is required', 'INVALID_NOTIFICATION_ID')
            return
        }

        try {
            const result = await this.markNotificationReadUseCase.execute(data.notificationId, user.userId)

            this.emitSuccess(client, 'notification-read', {
                notificationId: data.notificationId,
                notification: result.data,
                message: 'Notification marked as read',
            })
        } catch (error) {
            this.emitError(client, error.message, 'MARK_READ_FAILED')
        }
    }

    /**
     * Client deletes a notification
     * Calls DeleteNotificationUseCase and broadcasts update
     */
    @UseGuards(WsPermissionsGuard)
    @RequireWsPermissions('NOTIFICATION_MANAGE')
    @SubscribeMessage('delete-notification')
    async handleDeleteNotification(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { notificationId: number }
    ) {
        const user = this.getUser(client)

        if (!data.notificationId) {
            this.emitError(client, 'Notification ID is required', 'INVALID_NOTIFICATION_ID')
            return
        }

        try {
            await this.deleteNotificationUseCase.execute(data.notificationId, user.userId)

            this.emitSuccess(client, 'notification-deleted', {
                notificationId: data.notificationId,
                message: 'Notification deleted successfully',
            })
        } catch (error) {
            this.emitError(client, error.message, 'DELETE_FAILED')
        }
    }
}
