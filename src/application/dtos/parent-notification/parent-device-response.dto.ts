import { UserDevice } from '../../../domain/entities/notification/user-device.entity'
import { DevicePlatform } from '../../../shared/enums'

export class ParentDeviceResponseDto {
  deviceId: string
  platform: DevicePlatform
  lastSeenAt: Date

  static fromDevice(device: UserDevice): ParentDeviceResponseDto {
    return {
      deviceId: device.deviceId,
      platform: device.platform,
      lastSeenAt: device.lastSeenAt,
    }
  }
}
