import { Prisma } from '@prisma/client'
import { UserNotificationSetting } from '../../../domain/entities/notification/user-notification-setting.entity'
import type { IUserNotificationSettingRepository } from '../../../domain/repositories/user-notification-setting.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { NumberUtil } from '../../../shared/utils'
import { UserNotificationSettingMapper } from '../../mappers/notification/user-notification-setting.mapper'

export class PrismaUserNotificationSettingRepository implements IUserNotificationSettingRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async findByUserId(userId: number): Promise<UserNotificationSetting | null> {
    const record = await this.prisma.userNotificationSetting.findUnique({
      where: { userId: NumberUtil.ensureValidId(userId, 'User ID') },
    })

    return record ? UserNotificationSettingMapper.toDomain(record) : null
  }

  async upsertEnabled(userId: number, isEnabled: boolean | null): Promise<UserNotificationSetting> {
    const validUserId = NumberUtil.ensureValidId(userId, 'User ID')
    const record = await this.prisma.userNotificationSetting.upsert({
      where: { userId: validUserId },
      create: { userId: validUserId, isEnabled },
      update: { isEnabled },
    })

    return UserNotificationSettingMapper.toDomain(record)
  }
}
