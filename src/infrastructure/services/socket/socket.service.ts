// src/infrastructure/services/socket/socket.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'

/**
 * SocketService
 * 
 * Core service for managing Socket.IO server operations.
 * Provides methods to emit events to specific users, rooms, or broadcast to all clients.
 * 
 * @layer Infrastructure
 * @responsibilities
 * - Manage Socket.IO server instance
 * - Emit events to users/rooms/broadcast
 * - Handle room join/leave operations
 * - Track online users
 */
@Injectable()
export class SocketService {
    private readonly logger = new Logger(SocketService.name)
    private server: Server

    /**
     * Set the Socket.IO server instance
     * Called from Gateway after initialization
     * With root namespace, server IS the root IO instance directly
     */
    setServer(server: Server) {
        if (!this.server) {
            this.server = server
            this.logger.log('Socket.IO root server initialized')
            this.logger.debug(`Has adapter: ${!!server?.sockets?.adapter}, Rooms: ${server?.sockets?.adapter?.rooms?.size || 0}`)
        }
    }

    /**
     * Get the Socket.IO server instance
     */
    getServer(): Server {
        return this.server
    }

    /**
     * Emit event to a specific user
     * User must be connected and in room `user:{userId}`
     */
    emitToUser(userId: number, event: string, data: any) {
        if (!this.server) {
            this.logger.warn('Socket.IO server not initialized yet')
            return
        }
        this.server.to(`user:${userId}`).emit(event, data)
        this.logger.debug(`Emitted '${event}' to user:${userId}`)
    }

    /**
     * Emit event to a specific room
     */
    emitToRoom(roomId: string, event: string, data: any) {
        if (!this.server) {
            this.logger.warn('Socket.IO server not initialized yet')
            return
        }
        this.server.to(roomId).emit(event, data)
        this.logger.debug(`Emitted '${event}' to room:${roomId}`)
    }

    /**
     * Broadcast event to all connected clients
     */
    broadcast(event: string, data: any) {
        if (!this.server) {
            this.logger.warn('Socket.IO server not initialized yet')
            return
        }
        this.server.emit(event, data)
        this.logger.debug(`Broadcasted '${event}' to all clients`)
    }

    /**
     * Join a client to a room
     */
    joinRoom(socket: Socket, roomId: string) {
        socket.join(roomId)
        this.logger.debug(`Socket ${socket.id} joined room: ${roomId}`)
    }

    /**
     * Remove a client from a room
     */
    leaveRoom(socket: Socket, roomId: string) {
        socket.leave(roomId)
        this.logger.debug(`Socket ${socket.id} left room: ${roomId}`)
    }

    /**
     * Get all rooms a socket is in
     */
    getSocketRooms(socket: Socket): Set<string> {
        return socket.rooms
    }

    /**
     * Get number of clients in a room
     */
    getRoomSize(roomId: string): number {
        if (!this.server || !this.server.sockets || !this.server.sockets.adapter || !this.server.sockets.adapter.rooms) {
            return 0
        }
        return this.server.sockets.adapter.rooms.get(roomId)?.size || 0
    }

    /**
     * Check if user is online (connected)
     */
    isUserOnline(userId: number): boolean {
        if (!this.server) return false
        const roomSize = this.getRoomSize(`user:${userId}`)
        return roomSize > 0
    }

    /**
     * Get all connected clients count
     */
    getConnectedClientsCount(): number {
        if (!this.server) return 0
        return this.server.sockets.sockets.size
    }

    /**
     * Get count of online users (distinct user rooms)
     * Counts unique user:{id} rooms that have active connections
     */
    getOnlineUserCount(): number {
        if (!this.server) return 0

        let count = 0
        this.server.sockets.adapter.rooms.forEach((sockets, roomId) => {
            if (roomId.startsWith('user:') && sockets.size > 0) {
                count++
            }
        })

        return count
    }

    /**
     * Get all online user IDs
     */
    getOnlineUserIds(): number[] {
        if (!this.server) return []

        const userIds: number[] = []
        this.server.sockets.adapter.rooms.forEach((sockets, roomId) => {
            if (roomId.startsWith('user:') && sockets.size > 0) {
                const userId = parseInt(roomId.replace('user:', ''))
                if (!isNaN(userId)) {
                    userIds.push(userId)
                }
            }
        })

        return userIds
    }

    /**
     * Get online users count by type (admin/student)
     * Counts unique users from user:{id} rooms
     */
    getOnlineUsersByType(): { admin: number; student: number; total: number } {
        if (!this.server || !this.server.sockets || !this.server.sockets.adapter || !this.server.sockets.adapter.rooms) {
            return { admin: 0, student: 0, total: 0 }
        }

        let adminCount = 0
        let studentCount = 0

        // Iterate through all rooms to find user:{id} rooms
        this.server.sockets.adapter.rooms.forEach((socketIds, roomName) => {
            // Check if this is a user room (pattern: user:{userId})
            if (roomName.startsWith('user:')) {
                // Get any socket from this room to check userType
                const socketId = Array.from(socketIds)[0]
                const socket = this.server.sockets.sockets.get(socketId)

                if (socket && socket.data.user) {
                    const userType = socket.data.user.userType

                    if (userType === 'admin') {
                        adminCount++
                    } else if (userType === 'student') {
                        studentCount++
                    }
                }
            }
        })

        return {
            admin: adminCount,
            student: studentCount,
            total: adminCount + studentCount,
        }
    }

    /**
     * Get detailed online users statistics
     * Returns unique user count (not socket count) by type
     * Uses user:{id} rooms as source of truth
     */
    getOnlineUsersStats(): {
        admin: { count: number; userIds: number[] }
        student: { count: number; userIds: number[] }
        total: number
    } {
        this.logger.debug('Calculating online users statistics...')
        if (!this.server || !this.server.sockets || !this.server.sockets.adapter || !this.server.sockets.adapter.rooms) {
            return {
                admin: { count: 0, userIds: [] },
                student: { count: 0, userIds: [] },
                total: 0,
            }
        }

        const adminUserIds: number[] = []
        const studentUserIds: number[] = []

        // Iterate through all rooms to find user:{id} rooms
        this.server.sockets.adapter.rooms.forEach((socketIds, roomName) => {
            // Check if this is a user room (pattern: user:{userId})
            if (roomName.startsWith('user:')) {
                const userId = parseInt(roomName.split(':')[1])

                // Get any socket from this room to check userType
                const socketId = Array.from(socketIds)[0]
                const socket = this.server.sockets.sockets.get(socketId)

                if (socket && socket.data.user) {
                    const userType = socket.data.user.userType

                    if (userType === 'admin') {
                        adminUserIds.push(userId)
                    } else if (userType === 'student') {
                        studentUserIds.push(userId)
                    }
                }
            }
        })

        this.logger.debug(`Online Users Stats - Admins: ${adminUserIds.length}, Students: ${studentUserIds.length}`)

        return {
            admin: {
                count: adminUserIds.length,
                userIds: adminUserIds,
            },
            student: {
                count: studentUserIds.length,
                userIds: studentUserIds,
            },
            total: adminUserIds.length + studentUserIds.length,
        }
    }
}
