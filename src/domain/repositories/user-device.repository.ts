import { UserDevice } from '../entities/notification/user-device.entity'
import { DevicePlatform } from '../../shared/enums'

export interface UpsertUserDeviceData {
  userId: number
  deviceId: string
  fcmToken: string
  platform: DevicePlatform
  appVersion?: string
}

export interface IUserDeviceRepository {
  /**
   * Đăng ký hoặc cập nhật thiết bị theo (userId, deviceId).
   * FCM token là duy nhất toàn bảng nên mọi bản ghi khác đang giữ cùng token bị xóa (chuyển quyền sở hữu).
   */
  upsertOwned(data: UpsertUserDeviceData): Promise<UserDevice>
  /** Xóa mọi thiết bị của tài khoản; trả về số bản ghi đã xóa. */
  deleteByUserId(userId: number): Promise<number>
  /** Xóa mọi thiết bị của tài khoản trừ thiết bị có deviceId được giữ lại (nếu truyền). */
  deleteByUserIdExceptDevice(userId: number, keepDeviceId?: string): Promise<number>
  /** Xóa một thiết bị của tài khoản theo deviceId. */
  deleteByUserIdAndDeviceId(userId: number, deviceId: string): Promise<number>
}
