import { Prisma } from '@prisma/client'
import { ParentNotificationSetting } from '../../../domain/entities/notification/parent-notification-setting.entity'
import type {
  IParentNotificationSettingRepository,
  ParentNotificationPreferencesData,
} from '../../../domain/repositories/parent-notification-setting.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { NumberUtil } from '../../../shared/utils'
import { ParentNotificationSettingMapper } from '../../mappers/notification/parent-notification-setting.mapper'

export class PrismaParentNotificationSettingRepository implements IParentNotificationSettingRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async findByParentId(parentId: number): Promise<ParentNotificationSetting | null> {
    const record = await this.prisma.parentNotificationSetting.findUnique({
      where: { parentId: NumberUtil.ensureValidId(parentId, 'Parent ID') },
    })

    return record ? ParentNotificationSettingMapper.toDomain(record) : null
  }

  async upsertPreferences(
    parentId: number,
    data: ParentNotificationPreferencesData,
  ): Promise<ParentNotificationSetting> {
    const validParentId = NumberUtil.ensureValidId(parentId, 'Parent ID')
    const record = await this.prisma.parentNotificationSetting.upsert({
      where: { parentId: validParentId },
      create: {
        parentId: validParentId,
        attendanceEnabled: data.attendanceEnabled,
        resultEnabled: data.resultEnabled,
        tuitionEnabled: data.tuitionEnabled,
      },
      update: {
        attendanceEnabled: data.attendanceEnabled,
        resultEnabled: data.resultEnabled,
        tuitionEnabled: data.tuitionEnabled,
      },
    })

    return ParentNotificationSettingMapper.toDomain(record)
  }
}
