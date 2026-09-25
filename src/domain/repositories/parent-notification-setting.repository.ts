import { ParentNotificationSetting } from '../entities/notification/parent-notification-setting.entity'

export interface ParentNotificationPreferencesData {
  attendanceEnabled?: boolean
  resultEnabled?: boolean
  tuitionEnabled?: boolean
}

export interface IParentNotificationSettingRepository {
  findByParentId(parentId: number): Promise<ParentNotificationSetting | null>
  /** Tạo (giá trị thiếu lấy mặc định bật) hoặc cập nhật từng phần các cờ loại thông báo của phụ huynh. */
  upsertPreferences(parentId: number, data: ParentNotificationPreferencesData): Promise<ParentNotificationSetting>
}
