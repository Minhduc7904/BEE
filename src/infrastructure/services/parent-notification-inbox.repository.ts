import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import {
  encodeParentNotificationCursor,
  MarkParentNotificationReadResult,
  ParentNotificationInboxItem,
  ParentNotificationInboxPage,
  ParentNotificationInboxQuery,
  ParentNotificationInboxRepository,
  ParentNotificationInboxStats,
} from '../../application/interfaces'
import { PrismaService } from '../../prisma/prisma.service'
import { ParentNotificationInboxMapper } from '../mappers/notification/parent-notification-inbox.mapper'

const inboxSelect = {
  notificationId: true,
  userId: true,
  title: true,
  message: true,
  type: true,
  level: true,
  data: true,
  isRead: true,
  readAt: true,
  createdAt: true,
  notificationDispatchRecipient: { select: { sourceStudentId: true } },
} satisfies Prisma.NotificationSelect

@Injectable()
export class PrismaParentNotificationInboxRepository extends ParentNotificationInboxRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async isStudentLinked(parentId: number, studentId: number): Promise<boolean> {
    const link = await this.prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
      select: { studentId: true },
    })
    return link !== null
  }

  async list(query: ParentNotificationInboxQuery): Promise<ParentNotificationInboxPage> {
    const where: Prisma.NotificationWhereInput = {
      userId: query.userId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.isRead !== undefined ? { isRead: query.isRead } : {}),
      AND: [
        ...(query.after
          ? [
              {
                OR: [
                  { createdAt: { lt: query.after.createdAt } },
                  { createdAt: query.after.createdAt, notificationId: { lt: query.after.notificationId } },
                ],
              } satisfies Prisma.NotificationWhereInput,
            ]
          : []),
        ...(query.studentId
          ? [
              {
                OR: [
                  { notificationDispatchRecipient: { is: { sourceStudentId: query.studentId } } },
                  { notificationDispatchRecipient: { is: { sourceStudentId: null } } },
                  { notificationDispatchRecipient: { is: null } },
                ],
              } satisfies Prisma.NotificationWhereInput,
            ]
          : []),
      ],
    }
    const rows = await this.prisma.notification.findMany({
      where,
      select: inboxSelect,
      orderBy: [{ createdAt: 'desc' }, { notificationId: 'desc' }],
      take: query.limit + 1,
    })
    const hasNext = rows.length > query.limit
    const page = hasNext ? rows.slice(0, query.limit) : rows
    const last = page.at(-1)
    return {
      data: page.map((row) => ParentNotificationInboxMapper.toReadModel(row)),
      hasNext,
      nextCursor: hasNext && last ? encodeParentNotificationCursor(last.createdAt, last.notificationId) : null,
    }
  }

  async getStats(userId: number): Promise<ParentNotificationInboxStats> {
    const [total, unread] = await this.prisma.$transaction([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ])
    return { total, unread, read: total - unread }
  }

  async findOwnedById(userId: number, notificationId: number): Promise<ParentNotificationInboxItem | null> {
    const row = await this.prisma.notification.findFirst({
      where: { notificationId, userId },
      select: inboxSelect,
    })
    return row ? ParentNotificationInboxMapper.toReadModel(row) : null
  }

  async markRead(userId: number, notificationId: number): Promise<MarkParentNotificationReadResult> {
    const [updated, row] = await this.prisma.$transaction([
      this.prisma.notification.updateMany({
        where: { notificationId, userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      }),
      this.prisma.notification.findFirst({ where: { notificationId, userId }, select: inboxSelect }),
    ])
    return { notification: row ? ParentNotificationInboxMapper.toReadModel(row) : null, changed: updated.count > 0 }
  }
}
