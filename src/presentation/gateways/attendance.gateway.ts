// src/presentation/gateways/attendance.gateway.ts
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

/**
 * AttendanceGateway
 * 
 * WebSocket gateway for real-time attendance tracking.
 * Handles class session room management and attendance updates.
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
export class AttendanceGateway extends BaseGateway {
    constructor(
        socketService: SocketService,
        socketAuthService: SocketAuthService,
        socketRoomService: SocketRoomService,
    ) {
        super(socketService, socketAuthService, socketRoomService)
    }

    /**
     * Client joins a class session room
     */
    @SubscribeMessage('join-class-session')
    handleJoinClassSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: number }
    ) {
        const user = this.getUser(client)

        if (!data.sessionId) {
            this.emitError(client, 'Session ID is required', 'INVALID_SESSION_ID')
            return
        }

        const roomId = this.socketRoomService.getClassSessionRoom(data.sessionId)
        this.socketService.joinRoom(client, roomId)

        this.emitSuccess(client, 'class-session-joined', {
            sessionId: data.sessionId,
            roomId,
        })

        this.logger.debug(`User ${user.userId} joined class session ${data.sessionId}`)
    }

    /**
     * Client leaves a class session room
     */
    @SubscribeMessage('leave-class-session')
    handleLeaveClassSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: number }
    ) {
        const user = this.getUser(client)

        if (!data.sessionId) {
            this.emitError(client, 'Session ID is required', 'INVALID_SESSION_ID')
            return
        }

        const roomId = this.socketRoomService.getClassSessionRoom(data.sessionId)
        this.socketService.leaveRoom(client, roomId)

        this.emitSuccess(client, 'class-session-left', {
            sessionId: data.sessionId,
        })

        this.logger.debug(`User ${user.userId} left class session ${data.sessionId}`)
    }

    // ========================================
    // SERVER-SIDE METHODS (Called from Use Cases)
    // ========================================

    /**
     * Notify class session about attendance check-in
     * Called from CreateAttendanceUseCase
     */
    notifyAttendanceCheckIn(sessionId: number, attendance: any) {
        const roomId = this.socketRoomService.getClassSessionRoom(sessionId)

        this.socketService.emitToRoom(roomId, 'attendance-checked-in', {
            sessionId,
            attendance,
            timestamp: new Date().toISOString(),
        })

        this.logger.debug(`Notified session ${sessionId} about check-in`)
    }

    /**
     * Notify class session about attendance update
     */
    notifyAttendanceUpdate(sessionId: number, attendance: any) {
        const roomId = this.socketRoomService.getClassSessionRoom(sessionId)

        this.socketService.emitToRoom(roomId, 'attendance-updated', {
            sessionId,
            attendance,
            timestamp: new Date().toISOString(),
        })

        this.logger.debug(`Notified session ${sessionId} about attendance update`)
    }

    /**
     * Notify class session about status change
     */
    notifySessionStatusChange(sessionId: number, status: string) {
        const roomId = this.socketRoomService.getClassSessionRoom(sessionId)

        this.socketService.emitToRoom(roomId, 'session-status-changed', {
            sessionId,
            status,
            timestamp: new Date().toISOString(),
        })

        this.logger.debug(`Notified session ${sessionId} about status change: ${status}`)
    }

    /**
     * Broadcast session start to all participants
     */
    notifySessionStart(sessionId: number, session: any) {
        const roomId = this.socketRoomService.getClassSessionRoom(sessionId)

        this.socketService.emitToRoom(roomId, 'session-started', {
            session,
            timestamp: new Date().toISOString(),
        })

        this.logger.log(`Session ${sessionId} started`)
    }

    /**
     * Broadcast session end to all participants
     */
    notifySessionEnd(sessionId: number) {
        const roomId = this.socketRoomService.getClassSessionRoom(sessionId)

        this.socketService.emitToRoom(roomId, 'session-ended', {
            sessionId,
            timestamp: new Date().toISOString(),
        })

        this.logger.log(`Session ${sessionId} ended`)
    }
}
