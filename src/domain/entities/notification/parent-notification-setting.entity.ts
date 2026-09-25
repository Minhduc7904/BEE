/**
 * Lựa chọn nhận từng loại thông báo của phụ huynh.
 * Chỉ có tác dụng khi thông báo tổng của tài khoản đang bật.
 */
export class ParentNotificationSetting {
  settingId: number
  parentId: number
  attendanceEnabled: boolean
  resultEnabled: boolean
  tuitionEnabled: boolean
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    settingId: number
    parentId: number
    attendanceEnabled: boolean
    resultEnabled: boolean
    tuitionEnabled: boolean
    createdAt: Date
    updatedAt: Date
  }) {
    this.settingId = data.settingId
    this.parentId = data.parentId
    this.attendanceEnabled = data.attendanceEnabled
    this.resultEnabled = data.resultEnabled
    this.tuitionEnabled = data.tuitionEnabled
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
