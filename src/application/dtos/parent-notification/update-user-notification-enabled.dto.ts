import { IsRequiredBoolean } from '../../../shared/decorators/validate'

export class UpdateUserNotificationEnabledDto {
  @IsRequiredBoolean('Thông báo tổng')
  isEnabled: boolean
}
