import { Prisma } from '@prisma/client'
import { NotificationDispatchRecipient } from '../../../domain/entities/notification'
import type {
  CreateNotificationDispatchRecipientData,
  NotificationDispatchRecipientListOptions,
  NotificationRecipientSearchOptions,
  NotificationRecipientSnapshot,
} from '../../../domain/interface/notification-dispatch'
import type { INotificationDispatchRecipientRepository } from '../../../domain/repositories'
import { NotificationRecipientType } from '../../../shared/enums'
import { PrismaService } from '../../../prisma/prisma.service'
import { NotificationDispatchRecipientMapper } from '../../mappers/notification/notification-dispatch-recipient.mapper'

export class PrismaNotificationDispatchRecipientRepository implements INotificationDispatchRecipientRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async createMany(data: CreateNotificationDispatchRecipientData[]): Promise<NotificationDispatchRecipient[]> {
    if (data.length === 0) return []
    await this.prisma.notificationDispatchRecipient.createMany({ data, skipDuplicates: true })
    const jobIds = Array.from(new Set(data.map((item) => item.notificationDispatchJobId)))
    const userIds = Array.from(new Set(data.map((item) => item.userId)))
    const records = await this.prisma.notificationDispatchRecipient.findMany({
      where: {
        notificationDispatchJobId: { in: jobIds },
        userId: { in: userIds },
      },
      orderBy: { notificationDispatchRecipientId: 'asc' },
    })
    return NotificationDispatchRecipientMapper.toDomainList(records)
  }

  async resolveSnapshots(userIds: number[]): Promise<NotificationRecipientSnapshot[]> {
    if (userIds.length === 0) return []
    const users = await this.prisma.user.findMany({
      where: { userId: { in: userIds }, isActive: true },
      include: { student: true, admin: true, parent: true },
    })
    return users.map((user) => this.toSnapshot(user)).filter((item): item is NotificationRecipientSnapshot => !!item)
  }

  async search(
    options: NotificationRecipientSearchOptions,
  ): Promise<{ items: NotificationRecipientSnapshot[]; total: number }> {
    const profileFilter: Prisma.UserWhereInput =
      options.recipientType === NotificationRecipientType.STUDENT
        ? { student: { is: options.grade ? { grade: options.grade } : {} } }
        : options.recipientType === NotificationRecipientType.ADMIN
          ? { admin: { isNot: null } }
          : { parent: { isNot: null } }
    const term = options.search.trim()
    const where: Prisma.UserWhereInput = {
      isActive: true,
      ...profileFilter,
      OR: [
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { email: { contains: term } },
        { username: { contains: term } },
        ...(options.recipientType === NotificationRecipientType.PARENT
          ? [{ parent: { is: { phone: { contains: term } } } }]
          : []),
        ...(options.recipientType === NotificationRecipientType.STUDENT
          ? [
              { student: { is: { studentPhone: { contains: term } } } },
              { student: { is: { parentPhone: { contains: term } } } },
            ]
          : []),
      ],
    }
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: { student: true, admin: true, parent: true },
      }),
      this.prisma.user.count({ where }),
    ])
    return {
      total,
      items: users.map((user) => this.toSnapshot(user)).filter((item): item is NotificationRecipientSnapshot => !!item),
    }
  }

  async findAllByJob(
    notificationDispatchJobId: number,
    options: NotificationDispatchRecipientListOptions,
  ): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const where: Prisma.NotificationDispatchRecipientWhereInput = {
      notificationDispatchJobId,
      recipientType: options.recipientType,
      OR: options.search
        ? [
            { displayName: { contains: options.search } },
            { email: { contains: options.search } },
            { phone: { contains: options.search } },
          ]
        : undefined,
      deliveries:
        options.channel || options.deliveryStatus
          ? { some: { channel: options.channel, status: options.deliveryStatus } }
          : undefined,
    }
    const [records, total] = await Promise.all([
      this.prisma.notificationDispatchRecipient.findMany({
        where,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        orderBy: { notificationDispatchRecipientId: 'asc' },
        include: { deliveries: { orderBy: { channel: 'asc' } } },
      }),
      this.prisma.notificationDispatchRecipient.count({ where }),
    ])
    return { items: records, total }
  }

  private toSnapshot(user: {
    userId: number
    firstName: string
    lastName: string
    email: string | null
    student: { studentId: number; studentPhone: string | null; grade: number } | null
    admin: { adminId: number } | null
    parent: { parentId: number; phone: string } | null
  }): NotificationRecipientSnapshot | null {
    const displayName = `${user.lastName} ${user.firstName}`.trim()
    if (user.parent)
      return {
        userId: user.userId,
        profileId: user.parent.parentId,
        recipientType: NotificationRecipientType.PARENT,
        displayName,
        email: user.email ?? undefined,
        phone: user.parent.phone,
      }
    if (user.student)
      return {
        userId: user.userId,
        profileId: user.student.studentId,
        recipientType: NotificationRecipientType.STUDENT,
        displayName,
        email: user.email ?? undefined,
        phone: user.student.studentPhone ?? undefined,
        grade: user.student.grade,
      }
    if (user.admin)
      return {
        userId: user.userId,
        profileId: user.admin.adminId,
        recipientType: NotificationRecipientType.ADMIN,
        displayName,
        email: user.email ?? undefined,
      }
    return {
      userId: user.userId,
      profileId: user.userId,
      recipientType: NotificationRecipientType.UNKNOWN,
      displayName,
      email: user.email ?? undefined,
    }
  }
}
