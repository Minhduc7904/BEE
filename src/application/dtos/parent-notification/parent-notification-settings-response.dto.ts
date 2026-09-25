import { ParentNotificationSetting } from '../../../domain/entities/notification/parent-notification-setting.entity'
import { UserNotificationSetting } from '../../../domain/entities/notification/user-notification-setting.entity'

export class ParentNotificationSettingsResponseDto {
  /** null = chưa hỏi người dùng, true = đồng ý nhận, false = không nhận. */
  isEnabled: boolean | null
  attendanceEnabled: boolean
  resultEnabled: boolean
  tuitionEnabled: boolean

  /**
   * Chưa có bản ghi nghĩa là dùng mặc định: chưa hỏi (null) và bật cả ba loại thông báo.
   */
  static from(
    userSetting: UserNotificationSetting | null,
    parentSetting: ParentNotificationSetting | null,
  ): ParentNotificationSettingsResponseDto {
    return {
      isEnabled: userSetting?.isEnabled ?? null,
      attendanceEnabled: parentSetting?.attendanceEnabled ?? true,
      resultEnabled: parentSetting?.resultEnabled ?? true,
      tuitionEnabled: parentSetting?.tuitionEnabled ?? true,
    }
  }
}
