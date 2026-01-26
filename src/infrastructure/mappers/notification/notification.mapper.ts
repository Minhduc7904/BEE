// src/infrastructure/mappers/notification.mapper.ts

import { Notification } from '../../../domain/entities/notification/notification.entity'
import { NotificationType, NotificationLevel } from '../../../shared/enums'

/**
 * Mapper class để convert từ Prisma Notification model
 * sang Domain Notification entity
 */
export class NotificationMapper {
    /**
     * Convert Prisma Notification sang Domain Notification
     */
    static toDomainNotification(prismaNotification: any): Notification | undefined {
        if (!prismaNotification) return undefined

        return new Notification({
            notificationId: prismaNotification.notificationId,
            userId: prismaNotification.userId,
            title: prismaNotification.title,
            message: prismaNotification.message,

            type: prismaNotification.type as NotificationType,
            level: prismaNotification.level as NotificationLevel,

            isRead: prismaNotification.isRead ?? false,
            readAt: prismaNotification.readAt ?? undefined,

            data: prismaNotification.data ?? undefined,
            createdAt: prismaNotification.createdAt,
        })
    }

    /**
     * Convert array Prisma Notifications sang Domain Notifications
     */
    static toDomainNotifications(
        prismaNotifications: any[] | null | undefined
    ): Notification[] {
        if (!prismaNotifications || prismaNotifications.length === 0) return []

        return prismaNotifications
            .map((notification) => this.toDomainNotification(notification))
            .filter(Boolean) as Notification[]
    }
}
