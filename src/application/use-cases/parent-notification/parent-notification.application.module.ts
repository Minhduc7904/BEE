import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { SocketModule } from '../../../infrastructure/socket.module'
import { GetParentNotificationStatsUseCase } from './get-parent-notification-stats.use-case'
import { GetParentNotificationUseCase } from './get-parent-notification.use-case'
import { GetParentNotificationsUseCase } from './get-parent-notifications.use-case'
import { MarkParentNotificationReadUseCase } from './mark-parent-notification-read.use-case'
import { GetParentNotificationSettingsUseCase } from './get-parent-notification-settings.use-case'
import { RegisterParentDeviceUseCase } from './register-parent-device.use-case'
import { UnregisterParentDeviceUseCase } from './unregister-parent-device.use-case'
import { UpdateParentNotificationPreferencesUseCase } from './update-parent-notification-preferences.use-case'
import { UpdateUserNotificationEnabledUseCase } from './update-user-notification-enabled.use-case'

const PARENT_NOTIFICATION_USE_CASES = [
  RegisterParentDeviceUseCase,
  UnregisterParentDeviceUseCase,
  GetParentNotificationSettingsUseCase,
  UpdateUserNotificationEnabledUseCase,
  UpdateParentNotificationPreferencesUseCase,
  GetParentNotificationsUseCase,
  GetParentNotificationStatsUseCase,
  GetParentNotificationUseCase,
  MarkParentNotificationReadUseCase,
]

@Module({
  imports: [InfrastructureModule, SocketModule],
  providers: PARENT_NOTIFICATION_USE_CASES,
  exports: PARENT_NOTIFICATION_USE_CASES,
})
export class ParentNotificationApplicationModule {}
