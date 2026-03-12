// src/presentation/gateways/base.gateway.ts
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketServer
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { SocketAuthService } from '../../infrastructure/services/socket/socket-auth.service'
import { SocketService } from '../../infrastructure/services/socket/socket.service'
import { SocketRoomService } from '../../infrastructure/services/socket/socket-room.service'

/**
 * BaseGateway
 * 
 * Abstract base class for all Socket.IO gateways.
 * Handles common connection/disconnection logic and authentication.
 * 
 * @layer Presentation
 * @abstract
 * @implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
 */
export abstract class BaseGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    protected readonly logger = new Logger(this.constructor.name)

    @WebSocketServer()
    server: Server

    constructor(
        protected readonly socketService: SocketService,
        protected readonly socketAuthService: SocketAuthService,
        protected readonly socketRoomService: SocketRoomService,
    ) { }

    /**
     * Called after gateway initialization
     * Sets up the Socket.IO server in the socket service
     */
    afterInit(server: Server) {
        this.socketService.setServer(server)
        this.logger.log('Gateway initialized')
    }

    /**
     * Handle new client connection
     * Validates JWT token and sets up user rooms
     */
    async handleConnection(client: Socket) {
        try {
            // Extract token from handshake
            const token = this.socketAuthService.extractTokenFromHandshake(client.handshake)

            if (!token) {
                this.logger.warn('Connection rejected: No token provided')
                client.emit('error', { message: 'Authentication required' })
                client.disconnect()
                return
            }

            // Validate token and get user info
            const user = await this.socketAuthService.validateToken(token)

            // Store user info in socket data
            client.data.user = user

            // Join user-specific room for targeted messaging
            this.socketRoomService.joinUserRoom(client, user.userId)

            // Join role-based rooms for each role
            if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
                user.roles.forEach(role => {
                    if (role && role.name) {
                        this.socketRoomService.joinRoleRoom(client, role.name)
                    }
                })
            }

            // Join userType-based room (admin or student)
            if (user.userType) {
                this.socketRoomService.joinRoleRoom(client, user.userType)
            }

            // Emit connection success
            client.emit('connected', {
                message: 'Connected to WebSocket server',
                userId: user.userId,
                timestamp: new Date().toISOString(),
            })

            this.logger.log(`Client connected | user=${user.userId} | socket=${client.id} | type=${user.userType}`)

            // Broadcast online stats update (use setImmediate to ensure socket is fully registered)
            setImmediate(() => {
                this.broadcastOnlineStats()
            })

        } catch (error) {
            // this.logger.error(`Connection authentication failed: ${error.message}`)
            client.emit('error', { message: 'Authentication failed' })
            client.disconnect()
        }
    }

    /**
     * Handle client disconnection
     * Clean up resources and log disconnect
     */
    handleDisconnect(client: Socket) {
        const user = client.data.user

        if (user) {
            // Check if user still online (other tabs/devices)
            const stillOnline = this.socketService.isUserOnline(user.userId)

            if (!stillOnline) {
                // Last connection closed - user is now offline
                // Broadcast online stats update (use setImmediate to ensure socket is fully removed)
                setImmediate(() => {
                    this.broadcastOnlineStats()
                })
            } else {
                // User still has other connections
                // this.logger.debug(`Client disconnected | user=${user.userId} | socket=${client.id} | status=STILL_ONLINE`)
            }
        } else {
            // this.logger.debug(`Client disconnected | socket=${client.id} | status=UNAUTHENTICATED`)
        }
    }

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

