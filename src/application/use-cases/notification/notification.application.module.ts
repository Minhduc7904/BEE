import { Module } from '@nestjs/common'

import * as notification from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { SocketModule } from 'src/infrastructure/socket.module'
import { NotificationRealtimeService } from 'src/infrastructure/services/notification/notification-realtime.service'

const NOTIFICATION_USE_CASES = [
    notification.DeleteNotificationUseCase,
    notification.GetMyNotificationsUseCase,
    notification.GetNotificationStatsUseCase,
    notification.GetUserNotificationsUseCase,
    notification.MarkAllNotificationsReadUseCase,
    notification.MarkNotificationReadUseCase,
    notification.SendNotificationUseCase,
]

@Module({
    imports: [
        InfrastructureModule, // 🔥 BẮT BUỘC
        SocketModule, // 🔥 For SocketService used by NotificationRealtimeService
    ],
    providers: [
        ...NOTIFICATION_USE_CASES,
        NotificationRealtimeService,
    ],
    exports: [
        ...NOTIFICATION_USE_CASES,
        NotificationRealtimeService,
    ],
})
export class NotificationApplicationModule { }
