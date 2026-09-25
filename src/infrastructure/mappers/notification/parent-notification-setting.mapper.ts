import { ParentNotificationSetting as PrismaParentNotificationSetting } from '@prisma/client'
import { ParentNotificationSetting } from '../../../domain/entities/notification/parent-notification-setting.entity'

export class ParentNotificationSettingMapper {
  static toDomain(record: PrismaParentNotificationSetting): ParentNotificationSetting {
    return new ParentNotificationSetting({
      settingId: record.settingId,
      parentId: record.parentId,
      attendanceEnabled: record.attendanceEnabled,
      resultEnabled: record.resultEnabled,
      tuitionEnabled: record.tuitionEnabled,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
