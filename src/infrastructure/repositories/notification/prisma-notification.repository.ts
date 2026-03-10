// src/infrastructure/repositories/notification/prisma-notification.repository.ts
import { Injectable } from '@nestjs/common'
import { NotificationType, NotificationLevel } from '@prisma/client'
import { PrismaService } from '../../../prisma/prisma.service'
import type { INotificationRepository } from '../../../domain/repositories/notification.repository'
import { Notification } from '../../../domain/entities'
import {
    CreateNotificationData,
    UpdateNotificationData,
    NotificationFilterOptions,
    NotificationPaginationOptions,
    NotificationListResult,
    NotificationStats,
} from '../../../domain/interface/notification/notification.interface'
import { NotificationMapper } from '../../mappers/notification/notification.mapper'
import { NumberUtil } from '../../../shared/utils/number.util'

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
    constructor(private readonly prisma: PrismaService | any) {}

    async create(data: CreateNotificationData): Promise<Notification> {
        const prismaNotification = await this.prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type || 'SYSTEM',
                level: data.level || 'INFO',
                data: data.data,
            },
        })

        return NotificationMapper.toDomainNotification(prismaNotification)!
    }

    async createMany(dataList: CreateNotificationData[]): Promise<Notification[]> {
        const createData = dataList.map(data => ({
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: (data.type || 'SYSTEM') as NotificationType,
            level: (data.level || 'INFO') as NotificationLevel,
            data: data.data,
        }))

        await this.prisma.notification.createMany({
            data: createData,
        })

        // Fetch created notifications (Prisma createMany doesn't return created records)
        // Get recently created notifications for these users
        const userIds = [...new Set(dataList.map(d => d.userId))]
        const prismaNotifications = await this.prisma.notification.findMany({
            where: {
                userId: { in: userIds },
                createdAt: {
                    gte: new Date(Date.now() - 5000), // Last 5 seconds
                },
            },
            orderBy: { createdAt: 'desc' },
            take: dataList.length,
        })

        return NotificationMapper.toDomainNotifications(prismaNotifications)
    }

    async findById(id: number): Promise<Notification | null> {
        const numericId = NumberUtil.ensureValidId(id, 'Notification ID')

        const prismaNotification = await this.prisma.notification.findUnique({
            where: { notificationId: numericId },
        })

        if (!prismaNotification) return null
        return NotificationMapper.toDomainNotification(prismaNotification)!
    }

    async update(id: number, data: UpdateNotificationData): Promise<Notification> {
        const numericId = NumberUtil.ensureValidId(id, 'Notification ID')

        const updateData: any = { ...data }
        if (data.isRead && !data.isRead) {
            updateData.readAt = null
        }

        const prismaNotification = await this.prisma.notification.update({
            where: { notificationId: numericId },
            data: updateData,
        })

        return NotificationMapper.toDomainNotification(prismaNotification)!
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'Notification ID')

        await this.prisma.notification.delete({
            where: { notificationId: numericId },
        })

        return true
    }

    async findAll(): Promise<Notification[]> {
        const prismaNotifications = await this.prisma.notification.findMany({
            where: { user: { isActive: true } },
            orderBy: { createdAt: 'desc' },
        })

        return NotificationMapper.toDomainNotifications(prismaNotifications)
    }

    async findAllWithPagination(
        pagination: NotificationPaginationOptions,
        filters?: NotificationFilterOptions,
    ): Promise<NotificationListResult> {
        const page = pagination.page || 1
        const limit = pagination.limit || 20
        const sortBy = pagination.sortBy || 'createdAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        const where: any = {}

        if (filters?.userId !== undefined) {
            where.userId = filters.userId
        }

        if (filters?.type) {
            where.type = filters.type
        }

        if (filters?.level) {
            where.level = filters.level
        }

        if (filters?.isRead !== undefined) {
            where.isRead = filters.isRead
        }

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search } },
                { message: { contains: filters.search } },
            ]
        }

        if (filters?.fromDate || filters?.toDate) {
            where.createdAt = {}
            if (filters.fromDate) {
                where.createdAt.gte = filters.fromDate
            }
            if (filters.toDate) {
                where.createdAt.lte = filters.toDate
            }
        }

        // Chỉ xử lý thông báo của người dùng active
        where.user = { isActive: true }

        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [prismaNotifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy,
            }),
            this.prisma.notification.count({ where }),
        ])

        const notifications = NotificationMapper.toDomainNotifications(prismaNotifications)
        const totalPages = Math.ceil(total / limit)

        return {
            notifications,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async findByUserId(userId: number): Promise<Notification[]> {
        const prismaNotifications = await this.prisma.notification.findMany({
            where: { userId, user: { isActive: true } },
            orderBy: { createdAt: 'desc' },
        })

        return NotificationMapper.toDomainNotifications(prismaNotifications)
    }

    async findByUserIdWithPagination(
        userId: number,
        pagination: NotificationPaginationOptions,
        filters?: NotificationFilterOptions,
    ): Promise<NotificationListResult> {
        return this.findAllWithPagination(pagination, { ...filters, userId })
    }

    async markAsRead(notificationId: number, userId: number): Promise<Notification> {
        const numericId = NumberUtil.ensureValidId(notificationId, 'Notification ID')

        const prismaNotification = await this.prisma.notification.update({
            where: {
                notificationId: numericId,
                userId,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        })

        return NotificationMapper.toDomainNotification(prismaNotification)!
    }

    async markAllAsRead(userId: number): Promise<number> {
        const result = await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        })

        return result.count
    }

    async deleteAllByUserId(userId: number): Promise<number> {
        const result = await this.prisma.notification.deleteMany({
            where: { userId },
        })

        return result.count
    }

    async count(filters?: NotificationFilterOptions): Promise<number> {
        const where: any = {}

        if (filters?.userId !== undefined) {
            where.userId = filters.userId
        }

        if (filters?.type) {
            where.type = filters.type
        }

        if (filters?.level) {
            where.level = filters.level
        }

        if (filters?.isRead !== undefined) {
            where.isRead = filters.isRead
        }

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search } },
                { message: { contains: filters.message } },
            ]
        }

        if (filters?.fromDate || filters?.toDate) {
            where.createdAt = {}
            if (filters.fromDate) {
                where.createdAt.gte = filters.fromDate
            }
            if (filters.toDate) {
                where.createdAt.lte = filters.toDate
            }
        }

        // Chỉ đếm thông báo của người dùng active
        where.user = { isActive: true }

        return this.prisma.notification.count({ where })
    }

    async countByUserId(userId: number, filters?: NotificationFilterOptions): Promise<number> {
        return this.count({ ...filters, userId })
    }

    async countUnreadByUserId(userId: number): Promise<number> {
        return this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
                user: { isActive: true },
            },
        })
    }

    async getStatsByUserId(userId: number): Promise<NotificationStats> {
        const [total, unread] = await Promise.all([
            this.prisma.notification.count({ where: { userId, user: { isActive: true } } }),
            this.prisma.notification.count({ where: { userId, isRead: false, user: { isActive: true } } }),
        ])

        return {
            total,
            unread,
            read: total - unread,
        }
    }
}
