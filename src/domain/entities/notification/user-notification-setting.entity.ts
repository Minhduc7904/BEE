/**
 * Lựa chọn bật/tắt thông báo tổng của một tài khoản.
 * isEnabled: null = chưa hỏi người dùng, true = đồng ý nhận, false = không nhận.
 */
export class UserNotificationSetting {
  settingId: number
  userId: number
  isEnabled: boolean | null
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    settingId: number
    userId: number
    isEnabled: boolean | null
    createdAt: Date
    updatedAt: Date
  }) {
    this.settingId = data.settingId
    this.userId = data.userId
    this.isEnabled = data.isEnabled
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
