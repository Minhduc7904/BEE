// src/presentation/gateways/base.gateway.ts
import { WebSocketServer } from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { SocketAuthService } from '../../infrastructure/services/socket/socket-auth.service'
import { SocketService } from '../../infrastructure/services/socket/socket.service'
import { SocketRoomService } from '../../infrastructure/services/socket/socket-room.service'

/**
 * BaseGateway
 * 
 * Shared Socket.IO helpers for feature gateways.
 * Connection lifecycle is owned exclusively by SocketLifecycleGateway.
 * 
 * @layer Presentation
 * @abstract
 */
export abstract class BaseGateway {
    protected readonly logger = new Logger(this.constructor.name)

    @WebSocketServer()
    server: Server

    constructor(
        protected readonly socketService: SocketService,
        protected readonly socketAuthService: SocketAuthService,
        protected readonly socketRoomService: SocketRoomService,
    ) { }

    /**
     * Helper: Get user from socket
     */
    protected getUser(client: Socket) {
        return client.data.user
    }

    /**
     * Helper: Check if user has permission
     */
    protected hasPermission(client: Socket, permission: string): boolean {
        const user = this.getUser(client)
        if (!user) return false
        return user.permissions?.includes(permission) || false
    }

    /**
     * Helper: Check if user has role
     */
    protected hasRole(client: Socket, role: string): boolean {
        const user = this.getUser(client)
        if (!user) return false
        return user.role === role
    }

    /**
     * Helper: Emit error to client
     */
    protected emitError(client: Socket, message: string, code?: string) {
        client.emit('error', {
            message,
            code,
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * Helper: Emit success response to client
     */
    protected emitSuccess(client: Socket, event: string, data: any) {
        client.emit(event, {
            success: true,
            ...data,
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * Helper: Broadcast online statistics to all clients
     */
    protected broadcastOnlineStats() {
        const stats = this.socketService.getOnlineUsersStats()

        this.socketService.broadcast('online-stats-updated', {
            admin: stats.admin.count,
            student: stats.student.count,
            total: stats.total,
            timestamp: new Date().toISOString(),
        })
    }
}

