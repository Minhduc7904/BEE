// src/application/use-cases/notification/create-and-notify-one.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { INotificationRepository } from '../../../domain/repositories/notification.repository'
import type { CreateNotificationData } from '../../../domain/interface/notification/notification.interface'
import { Notification } from '../../../domain/entities'
import { NotificationRealtimeService } from 'src/infrastructure/services/notification/notification-realtime.service'

/**
 * CreateAndNotifyOneUseCase
 *
 * Tạo 1 notification trong DB và gửi realtime cho user.
 * Dùng khi cần gửi thông báo cho 1 user duy nhất (ví dụ: báo cáo admin, thông báo cá nhân, ...).
 */
@Injectable()
export class CreateAndNotifyOneUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: { executeInTransaction: Function },
        private readonly notificationRealtimeService: NotificationRealtimeService,
    ) { }

    /**
     * Tạo notification trong DB + gửi realtime
     * @param data - Dữ liệu notification cần tạo
     * @returns Notification đã tạo
     */
    async execute(data: CreateNotificationData): Promise<Notification> {
        const notification = await this.unitOfWork.executeInTransaction(
            async (repos: { notificationRepository: INotificationRepository }) => {
                return repos.notificationRepository.create(data)
            },
        )

        // Gửi realtime notification
        this.notificationRealtimeService.notifyUser(data.userId, notification)

        // Cập nhật stats realtime
        await this.updateStats(data.userId)

        return notification
    }

    /**
     * Helper: Cập nhật stats cho user qua realtime
     */
    private async updateStats(userId: number): Promise<void> {
        await this.unitOfWork.executeInTransaction(
            async (repos: { notificationRepository: INotificationRepository }) => {
                const stats = await repos.notificationRepository.getStatsByUserId(userId)
                this.notificationRealtimeService.notifyStatsUpdated(userId, {
                    total: stats.total,
                    unread: stats.unread,
                    read: stats.read,
                })
            },
        )
    }
}
