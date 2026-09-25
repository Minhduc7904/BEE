import { UserNotificationSetting as PrismaUserNotificationSetting } from '@prisma/client'
import { UserNotificationSetting } from '../../../domain/entities/notification/user-notification-setting.entity'

export class UserNotificationSettingMapper {
  static toDomain(record: PrismaUserNotificationSetting): UserNotificationSetting {
    return new UserNotificationSetting({
      settingId: record.settingId,
      userId: record.userId,
      isEnabled: record.isEnabled,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
