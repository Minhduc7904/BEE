import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import * as notification from './'
import notificationDeliveryConfig from '../../../config/notification-delivery.config'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { SocketModule } from 'src/infrastructure/socket.module'
import { GetValidZaloAccessTokenUseCase } from '../zalo/get-valid-zalo-access-token.use-case'

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
  notification.NotificationDeliveryChannelPolicyService,
  notification.PushNotificationEligibilityService,
  notification.SearchNotificationRecipientsUseCase,
  notification.GetNotificationDispatchJobsUseCase,
  notification.GetNotificationDispatchJobUseCase,
  notification.GetNotificationDispatchRecipientsUseCase,
  notification.BusinessNotificationQueueService,
  notification.RelayBusinessNotificationOutboxUseCase,
  GetValidZaloAccessTokenUseCase,
]

@Module({
  imports: [
    ConfigModule.forFeature(notificationDeliveryConfig),
    InfrastructureModule, // 🔥 BẮT BUỘC
    SocketModule, // 🔥 For SocketService used by NotificationRealtimeService
  ],
  providers: [...NOTIFICATION_USE_CASES],
  exports: [...NOTIFICATION_USE_CASES],
})
export class NotificationApplicationModule {}
