import {
  NotificationLevel as PrismaNotificationLevel,
  NotificationType as PrismaNotificationType,
  Prisma,
} from '@prisma/client'

import type { ParentNotificationInboxItem } from '../../../application/interfaces'
import { NotificationLevel, NotificationType } from '../../../shared/enums'

export interface PrismaParentNotificationInboxRow {
  notificationId: number
  userId: number
  title: string
  message: string
  type: PrismaNotificationType
  level: PrismaNotificationLevel
  data: Prisma.JsonValue | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
  notificationDispatchRecipient: { sourceStudentId: number | null } | null
}

export class ParentNotificationInboxMapper {
  static toReadModel(row: PrismaParentNotificationInboxRow): ParentNotificationInboxItem {
    return {
      notificationId: row.notificationId,
      userId: row.userId,
      sourceStudentId: row.notificationDispatchRecipient?.sourceStudentId ?? null,
      title: row.title,
      message: row.message,
      type: row.type as NotificationType,
      level: row.level as NotificationLevel,
      data: this.toRecord(row.data),
      isRead: row.isRead,
      readAt: row.readAt,
      createdAt: row.createdAt,
    }
  }

  private static toRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null
  }
}
