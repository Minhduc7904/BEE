import { UserNotificationSetting } from '../entities/notification/user-notification-setting.entity'

export interface IUserNotificationSettingRepository {
  findByUserId(userId: number): Promise<UserNotificationSetting | null>
  /** Tạo hoặc cập nhật lựa chọn thông báo tổng; null nghĩa là đưa về trạng thái chưa hỏi. */
  upsertEnabled(userId: number, isEnabled: boolean | null): Promise<UserNotificationSetting>
}
