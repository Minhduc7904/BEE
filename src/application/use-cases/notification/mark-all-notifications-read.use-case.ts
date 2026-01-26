// src/application/use-cases/notification/mark-all-notifications-read.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { INotificationRepository } from '../../../domain/repositories/notification.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotificationRealtimeService } from 'src/infrastructure/services/notification/notification-realtime.service'

@Injectable()
export class MarkAllNotificationsReadUseCase {
    constructor(
        @Inject('INotificationRepository')
        private readonly notificationRepository: INotificationRepository,
        private readonly notificationRealtimeService: NotificationRealtimeService,
    ) {}

    async execute(userId: number): Promise<BaseResponseDto<{ count: number }>> {
        const count = await this.notificationRepository.markAllAsRead(userId)

        // Emit updated stats to user
        const stats = await this.notificationRepository.getStatsByUserId(userId)
        this.notificationRealtimeService.notifyStatsUpdated(userId, {
            total: stats.total,
            unread: stats.unread,
            read: stats.read,
        })

        return {
            success: true,
            message: `Marked ${count} notifications as read`,
            data: { count },
        }
    }
}
