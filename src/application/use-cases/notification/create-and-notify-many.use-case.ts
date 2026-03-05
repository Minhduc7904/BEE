// src/application/use-cases/notification/create-and-notify-many.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { INotificationRepository } from '../../../domain/repositories/notification.repository'
import type { CreateNotificationData } from '../../../domain/interface/notification/notification.interface'
import { Notification } from '../../../domain/entities'
import { NotificationRealtimeService } from 'src/infrastructure/services/notification/notification-realtime.service'

/**
 * CreateAndNotifyManyUseCase
 *
 * Tạo nhiều notification trong DB và gửi realtime cho từng user.
 * Dùng khi cần gửi thông báo hàng loạt (ví dụ: gửi theo role, gửi tất cả, ...).
 */
@Injectable()
export class CreateAndNotifyManyUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: { executeInTransaction: Function },
        private readonly notificationRealtimeService: NotificationRealtimeService,
    ) { }

    /**
     * Tạo nhiều notification trong DB + gửi realtime cho từng user
     * @param dataList - Danh sách dữ liệu notification cần tạo
     * @returns Danh sách notification đã tạo
     */
    async execute(dataList: CreateNotificationData[]): Promise<Notification[]> {
        if (dataList.length === 0) return []

        const createdNotifications = await this.unitOfWork.executeInTransaction(
            async (repos: { notificationRepository: INotificationRepository }) => {
                return repos.notificationRepository.createMany(dataList)
            },
        )

        // Gửi realtime notification + cập nhật stats cho từng user
        await this.unitOfWork.executeInTransaction(
            async (repos: { notificationRepository: INotificationRepository }) => {
                for (let i = 0; i < dataList.length; i++) {
                    const userId = dataList[i].userId
                    const notification = createdNotifications[i]

                    // Gửi realtime notification
                    this.notificationRealtimeService.notifyUser(userId, notification)

                    // Cập nhật stats realtime
                    const stats = await repos.notificationRepository.getStatsByUserId(userId)
                    this.notificationRealtimeService.notifyStatsUpdated(userId, {
                        total: stats.total,
                        unread: stats.unread,
                        read: stats.read,
                    })
                }
            },
        )

        return createdNotifications
    }
}
