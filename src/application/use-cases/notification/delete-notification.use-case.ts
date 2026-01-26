// src/application/use-cases/notification/delete-notification.use-case.ts
import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common'
import type { INotificationRepository } from '../../../domain/repositories/notification.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotificationRealtimeService } from 'src/infrastructure/services/notification/notification-realtime.service'

@Injectable()
export class DeleteNotificationUseCase {
    constructor(
        @Inject('INotificationRepository')
        private readonly notificationRepository: INotificationRepository,
        private readonly notificationRealtimeService: NotificationRealtimeService,
    ) {}

    async execute(notificationId: number, userId: number): Promise<BaseResponseDto<null>> {
        // Check notification exists and belongs to user
        const notification = await this.notificationRepository.findById(notificationId)

        if (!notification) {
            throw new NotFoundException(`Notification with ID ${notificationId} not found`)
        }

        if (notification.userId !== userId) {
            throw new ForbiddenException('You do not have permission to delete this notification')
        }

        await this.notificationRepository.delete(notificationId)

        // Emit updated stats to user
        const stats = await this.notificationRepository.getStatsByUserId(userId)
        this.notificationRealtimeService.notifyStatsUpdated(userId, {
            total: stats.total,
            unread: stats.unread,
            read: stats.read,
        })

        return {
            success: true,
            message: 'Notification deleted successfully',
            data: null,
        }
    }
}
