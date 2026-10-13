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

    try {
      return await this.upsertOwnedOnce(userId, data)
    } catch (error) {
      if (!this.isUniqueConstraint(error)) throw error
      // Upsert của Prisma trên MySQL là đọc-rồi-ghi nên hai request đồng thời có thể cùng đi nhánh create
      // (uq_user_devices_user_device) hoặc tranh FCM token (uq_user_devices_fcm_token).
      // Use case chạy trong transaction REPEATABLE READ: SELECT thường (kể cả SELECT của upsert) đọc snapshot cũ
      // nên thử lại upsert vẫn không thấy bản ghi vừa được commit và lại INSERT -> P2002. UPDATE/DELETE luôn đọc
      // dữ liệu mới nhất đã commit, nên nhánh thử lại dùng deleteMany + updateMany (và chỉ create khi không có dòng nào).
      return this.upsertOwnedWithCurrentReads(userId, data)
    }
  }

  private async upsertOwnedWithCurrentReads(userId: number, data: UpsertUserDeviceData): Promise<UserDevice> {
    await this.deleteOtherOwnersOfToken(userId, data)

    const updated = await this.prisma.userDevice.updateMany({
      where: { userId, deviceId: data.deviceId },
      data: {
        fcmToken: data.fcmToken,
        platform: data.platform,
        appVersion: data.appVersion,
        lastSeenAt: new Date(),
      },
    })
    if (updated.count === 0) {
      await this.prisma.userDevice.create({
        data: {
          userId,
          deviceId: data.deviceId,
          fcmToken: data.fcmToken,
          platform: data.platform,
          appVersion: data.appVersion,
        },
      })
    }

    // Bản ghi vừa được ghi bởi chính transaction này nên SELECT thấy được.
    const record = await this.prisma.userDevice.findUniqueOrThrow({
      where: { userId_deviceId: { userId, deviceId: data.deviceId } },
    })
    return UserDeviceMapper.toDomain(record)
  }

  private async deleteOtherOwnersOfToken(userId: number, data: UpsertUserDeviceData): Promise<void> {
    // FCM token duy nhất toàn bảng: xóa mọi bản ghi khác (tài khoản khác hoặc deviceId khác) đang giữ cùng token.
    await this.prisma.userDevice.deleteMany({
      where: {
        fcmToken: data.fcmToken,
        NOT: { userId, deviceId: data.deviceId },
      },
    })
  }

  private async upsertOwnedOnce(userId: number, data: UpsertUserDeviceData): Promise<UserDevice> {
    await this.deleteOtherOwnersOfToken(userId, data)

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

  private isUniqueConstraint(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
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

  async findByUserIds(userIds: number[]): Promise<UserDevice[]> {
    if (userIds.length === 0) return []
    const records = await this.prisma.userDevice.findMany({
      where: { userId: { in: Array.from(new Set(userIds)) } },
      orderBy: { id: 'asc' },
    })
    return records.map((record) => UserDeviceMapper.toDomain(record))
  }

  async deleteByTokens(tokens: string[]): Promise<number> {
    if (tokens.length === 0) return 0
    const result = await this.prisma.userDevice.deleteMany({
      where: { fcmToken: { in: Array.from(new Set(tokens)) } },
    })
    return result.count
  }
}
