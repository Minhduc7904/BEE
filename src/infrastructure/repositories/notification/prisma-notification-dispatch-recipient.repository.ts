import { Prisma } from '@prisma/client'
import { NotificationDispatchRecipient } from '../../../domain/entities/notification'
import type {
  CreateNotificationDispatchRecipientData,
  NotificationDispatchRecipientListOptions,
  NotificationRecipientSearchOptions,
  NotificationRecipientSnapshot,
  NotificationParentTarget,
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
    const recipientKeys = Array.from(new Set(data.map((item) => item.recipientKey)))
    const records = await this.prisma.notificationDispatchRecipient.findMany({
      where: {
        notificationDispatchJobId: { in: jobIds },
        recipientKey: { in: recipientKeys },
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

  async resolveParentTargetsByStudentIds(studentIds: number[]): Promise<NotificationParentTarget[]> {
    if (studentIds.length === 0) return []
    const links = await this.prisma.parentStudent.findMany({
      where: { studentId: { in: Array.from(new Set(studentIds)) }, parent: { user: { isActive: true } } },
      include: { parent: { include: { user: true } } },
    })
    return links.map((link) => ({
      studentId: link.studentId,
      userId: link.parent.userId,
      profileId: link.parent.parentId,
      recipientType: NotificationRecipientType.PARENT,
      displayName: `${link.parent.user.lastName} ${link.parent.user.firstName}`.trim(),
      email: link.parent.user.email ?? undefined,
      phone: link.parent.phone,
    }))
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
    return {
      items: records.map((record) => ({
        ...record,
        deliveries: record.deliveries.map((delivery) => {
          const { pendingPushTokens: _pendingPushTokens, ...safeDelivery } = delivery
          return {
            ...safeDelivery,
            destination: delivery.destination ? this.maskDestination(delivery.destination) : null,
          }
        }),
      })),
      total,
    }
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

  private maskDestination(value: string): string {
    if (value.length <= 4) return '*'.repeat(value.length)
    return `${value.slice(0, 2)}${'*'.repeat(Math.min(8, value.length - 4))}${value.slice(-2)}`
  }
}
