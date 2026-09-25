import { Prisma } from '@prisma/client'
import { UserDevice } from '../../../domain/entities/notification/user-device.entity'
import type { IUserDeviceRepository, UpsertUserDeviceData } from '../../../domain/repositories/user-device.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { NumberUtil } from '../../../shared/utils'
import { UserDeviceMapper } from '../../mappers/notification/user-device.mapper'

export class PrismaUserDeviceRepository implements IUserDeviceRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async upsertOwned(data: UpsertUserDeviceData): Promise<UserDevice> {
    const userId = NumberUtil.ensureValidId(data.userId, 'User ID')

    // FCM token duy nhất toàn bảng: xóa mọi bản ghi khác (tài khoản khác hoặc deviceId khác) đang giữ cùng token.
    await this.prisma.userDevice.deleteMany({
      where: {
        fcmToken: data.fcmToken,
        NOT: { userId, deviceId: data.deviceId },
      },
    })

    const record = await this.prisma.userDevice.upsert({
      where: { userId_deviceId: { userId, deviceId: data.deviceId } },
      create: {
        userId,
        deviceId: data.deviceId,
        fcmToken: data.fcmToken,
        platform: data.platform,
        appVersion: data.appVersion,
      },
      update: {
        fcmToken: data.fcmToken,
        platform: data.platform,
        appVersion: data.appVersion,
        lastSeenAt: new Date(),
      },
    })

    return UserDeviceMapper.toDomain(record)
  }

  async deleteByUserId(userId: number): Promise<number> {
    const result = await this.prisma.userDevice.deleteMany({
      where: { userId: NumberUtil.ensureValidId(userId, 'User ID') },
    })

    return result.count
  }

  async deleteByUserIdExceptDevice(userId: number, keepDeviceId?: string): Promise<number> {
    const result = await this.prisma.userDevice.deleteMany({
      where: {
        userId: NumberUtil.ensureValidId(userId, 'User ID'),
        ...(keepDeviceId ? { NOT: { deviceId: keepDeviceId } } : {}),
      },
    })

    return result.count
  }

  async deleteByUserIdAndDeviceId(userId: number, deviceId: string): Promise<number> {
    const result = await this.prisma.userDevice.deleteMany({
      where: { userId: NumberUtil.ensureValidId(userId, 'User ID'), deviceId },
    })

    return result.count
  }
}
