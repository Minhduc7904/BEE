// src/infrastructure/services/socket/status-realtime.service.ts
import { Injectable } from '@nestjs/common'
import { SocketService } from './socket.service'
import { SOCKET_EVENTS } from 'src/shared/constants/socket-events.constant'

@Injectable()
export class StatusRealtimeService {
    constructor(
        private readonly socketService: SocketService,
    ) { }

    emitUserStatus(
        userId: number,
        isOnline: boolean,
        userType: 'admin' | 'student',
    ) {
        this.socketService.emitToRoom('status-updates', SOCKET_EVENTS.SYSTEM.USER_STATUS_CHANGED, {
            userId,
            isOnline,
            userType,
            timestamp: new Date().toISOString(),
        })
    }

    emitOnlineStats() {
        const stats = this.socketService.getOnlineUsersStats()

        this.socketService.emitToRoom('status-updates', SOCKET_EVENTS.SYSTEM.ONLINE_STATS_UPDATED, {
            admin: stats.admin.count,
            student: stats.student.count,
            total: stats.total,
            timestamp: new Date().toISOString(),
        })
    }

    getStats() {
        const stats = this.socketService.getOnlineUsersStats()
        return {
            admin: stats.admin.count,
            student: stats.student.count,
            total: stats.total,
        }
    }

    isUserOnline(userId: number): boolean {
        return this.socketService.isUserOnline(userId)
    }
}
