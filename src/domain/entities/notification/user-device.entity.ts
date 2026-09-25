import { DevicePlatform } from '../../../shared/enums'

/**
 * Thiết bị đang đăng ký nhận thông báo đẩy (FCM) của một tài khoản.
 */
export class UserDevice {
  id: number
  userId: number
  deviceId: string
  fcmToken: string
  platform: DevicePlatform
  appVersion?: string
  lastSeenAt: Date
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    id: number
    userId: number
    deviceId: string
    fcmToken: string
    platform: DevicePlatform
    appVersion?: string
    lastSeenAt: Date
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = data.id
    this.userId = data.userId
    this.deviceId = data.deviceId
    this.fcmToken = data.fcmToken
    this.platform = data.platform
    this.appVersion = data.appVersion
    this.lastSeenAt = data.lastSeenAt
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
