import { Module } from '@nestjs/common'

import * as notification from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { SocketModule } from 'src/infrastructure/socket.module'

const NOTIFICATION_USE_CASES = [
  notification.DeleteNotificationUseCase,
  notification.GetMyNotificationsUseCase,
  notification.GetNotificationStatsUseCase,
  notification.GetUserNotificationsUseCase,
  notification.MarkAllNotificationsReadUseCase,
  notification.MarkNotificationReadUseCase,
  notification.SendNotificationUseCase,
  notification.CreateAndNotifyOneUseCase,
  notification.CreateAndNotifyManyUseCase,
  notification.EnqueueNotificationDispatchJobUseCase,
  notification.DispatchNotificationDeliveriesUseCase,
  notification.PushNotificationEligibilityService,
  notification.SearchNotificationRecipientsUseCase,
  notification.GetNotificationDispatchJobsUseCase,
  notification.GetNotificationDispatchJobUseCase,
  notification.GetNotificationDispatchRecipientsUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
    SocketModule, // 🔥 For SocketService used by NotificationRealtimeService
  ],
  providers: [...NOTIFICATION_USE_CASES],
  exports: [...NOTIFICATION_USE_CASES],
})
export class NotificationApplicationModule {}
