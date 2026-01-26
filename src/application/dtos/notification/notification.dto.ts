// src/application/dtos/notification/notification.dto.ts
import { Notification } from '../../../domain/entities'
import { NotificationType, NotificationLevel } from '../../../shared/enums'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'

export class NotificationResponseDto {
    notificationId: number
    userId: number
    title: string
    message: string
    type: NotificationType
    level: NotificationLevel
    isRead: boolean
    readAt?: Date
    data?: Record<string, any>
    createdAt: Date

    static fromEntity(notification: Notification): NotificationResponseDto {
        const dto = new NotificationResponseDto()
        dto.notificationId = notification.notificationId
        dto.userId = notification.userId
        dto.title = notification.title
        dto.message = notification.message
        dto.type = notification.type
        dto.level = notification.level
        dto.isRead = notification.isRead
        dto.readAt = notification.readAt
        dto.data = notification.data
        dto.createdAt = notification.createdAt
        return dto
    }

    static fromEntities(notifications: Notification[]): NotificationResponseDto[] {
        return notifications.map(notification => this.fromEntity(notification))
    }
}

export class NotificationListResponseDto extends PaginationResponseDto<NotificationResponseDto> {
    constructor(
        data: NotificationResponseDto[],
        page: number,
        limit: number,
        total: number,
    ) {
        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasPrevious: page > 1,
            hasNext: page < Math.ceil(total / limit),
            previousPage: page > 1 ? page - 1 : undefined,
            nextPage: page < Math.ceil(total / limit) ? page + 1 : undefined,
        }
        super(true, 'Lấy danh sách thông báo thành công', data, meta)
    }
}

export class NotificationStatsResponseDto {
    total: number
    unread: number
    read: number

    static fromDomain(stats: { total: number; unread: number; read: number }): NotificationStatsResponseDto {
        const dto = new NotificationStatsResponseDto()
        dto.total = stats.total
        dto.unread = stats.unread
        dto.read = stats.read
        return dto
    }
}
