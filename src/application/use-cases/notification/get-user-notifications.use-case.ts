// src/application/use-cases/notification/get-user-notifications.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { INotificationRepository } from '../../../domain/repositories/notification.repository'
import { NotificationListQueryDto } from '../../dtos/notification/notification-list-query.dto'
import { NotificationListResponseDto, NotificationResponseDto } from '../../dtos/notification/notification.dto'

@Injectable()
export class GetUserNotificationsUseCase {
    constructor(
        @Inject('INotificationRepository')
        private readonly notificationRepository: INotificationRepository
    ) {}

    async execute(targetUserId: number, query: NotificationListQueryDto): Promise<NotificationListResponseDto> {
        const pagination = {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        const filters = {
            type: query.type,
            level: query.level,
            isRead: query.isRead,
            search: query.search,
            fromDate: query.fromDate,
            toDate: query.toDate,
        }

        const result = await this.notificationRepository.findByUserIdWithPagination(
            targetUserId,
            pagination,
            filters,
        )

        const data = result.notifications.map(notification => 
            NotificationResponseDto.fromEntity(notification)
        )

        return new NotificationListResponseDto(
            data,
            result.page,
            result.limit,
            result.total,
        )
    }
}
