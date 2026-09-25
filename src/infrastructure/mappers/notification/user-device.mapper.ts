import { UserDevice as PrismaUserDevice } from '@prisma/client'
import { UserDevice } from '../../../domain/entities/notification/user-device.entity'
import { DevicePlatform } from '../../../shared/enums'

export class UserDeviceMapper {
  static toDomain(record: PrismaUserDevice): UserDevice {
    return new UserDevice({
      id: record.id,
      userId: record.userId,
      deviceId: record.deviceId,
      fcmToken: record.fcmToken,
      // Prisma enum DevicePlatform và shared enum DevicePlatform có cùng bộ giá trị.
      platform: record.platform as DevicePlatform,
      appVersion: record.appVersion ?? undefined,
      lastSeenAt: record.lastSeenAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
