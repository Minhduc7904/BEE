// src/infrastructure/services/notification/notification-realtime.service.ts
import { Injectable } from '@nestjs/common'
import { SocketService } from '../socket/socket.service'
import { SOCKET_EVENTS } from 'src/shared/constants/socket-events.constant'

@Injectable()
export class NotificationRealtimeService {
    constructor(
        private readonly socketService: SocketService,
    ) { }

    notifyUser(userId: number, notification: any) {
        this.socketService.emitToUser(
            userId,
            SOCKET_EVENTS.NOTIFICATION.NEW,
            { notification }
        )
    }

    notifyStatsUpdated(userId: number, stats: {
        total: number
        unread: number
        read: number
    }) {
        this.socketService.emitToUser(
            userId,
            SOCKET_EVENTS.NOTIFICATION.STATS_UPDATED,
            stats
        )
    }
}
