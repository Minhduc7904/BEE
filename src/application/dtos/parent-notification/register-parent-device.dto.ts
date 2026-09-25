import { DevicePlatform } from '../../../shared/enums'
import { IsOptionalString, IsRequiredEnumValue, IsRequiredString } from '../../../shared/decorators/validate'

export class RegisterParentDeviceDto {
  @IsRequiredString('Mã thiết bị', 128)
  deviceId: string

  @IsRequiredString('FCM token', 512)
  fcmToken: string

  @IsRequiredEnumValue(DevicePlatform, 'Nền tảng thiết bị')
  platform: DevicePlatform

  @IsOptionalString('Phiên bản ứng dụng', 32)
  appVersion?: string
}
