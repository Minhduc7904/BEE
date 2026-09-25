import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
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
]

@Module({
  imports: [InfrastructureModule],
  providers: PARENT_NOTIFICATION_USE_CASES,
  exports: PARENT_NOTIFICATION_USE_CASES,
})
export class ParentNotificationApplicationModule {}
