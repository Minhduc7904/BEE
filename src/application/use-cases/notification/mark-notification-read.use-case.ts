// src/application/use-cases/notification/mark-notification-read.use-case.ts
import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common'
import type { INotificationRepository } from '../../../domain/repositories/notification.repository'
import { NotificationResponseDto } from '../../dtos/notification/notification.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotificationRealtimeService } from 'src/infrastructure/services/notification/notification-realtime.service'

@Injectable()
export class MarkNotificationReadUseCase {
    constructor(
        @Inject('INotificationRepository')
        private readonly notificationRepository: INotificationRepository,
        private readonly notificationRealtimeService: NotificationRealtimeService,
    ) {}

    async execute(notificationId: number, userId: number): Promise<BaseResponseDto<NotificationResponseDto>> {
        // Check notification exists and belongs to user
        const notification = await this.notificationRepository.findById(notificationId)

        if (!notification) {
            throw new NotFoundException(`Notification with ID ${notificationId} not found`)
        }

        if (notification.userId !== userId) {
            throw new ForbiddenException('You do not have permission to mark this notification as read')
        }

        const updated = await this.notificationRepository.markAsRead(notificationId, userId)

        // Emit updated stats to user
        const stats = await this.notificationRepository.getStatsByUserId(userId)
        this.notificationRealtimeService.notifyStatsUpdated(userId, {
            total: stats.total,
            unread: stats.unread,
            read: stats.read,
        })

        return {
            success: true,
            message: 'Notification marked as read',
            data: NotificationResponseDto.fromEntity(updated),
        }
    }
}
