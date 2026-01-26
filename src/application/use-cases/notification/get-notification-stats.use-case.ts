// src/application/use-cases/notification/get-notification-stats.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { INotificationRepository } from '../../../domain/repositories/notification.repository'
import { NotificationStatsResponseDto } from '../../dtos/notification/notification.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetNotificationStatsUseCase {
    constructor(
        @Inject('INotificationRepository')
        private readonly notificationRepository: INotificationRepository
    ) { }

    async execute(userId: number): Promise<BaseResponseDto<NotificationStatsResponseDto>> {
        const stats = await this.notificationRepository.getStatsByUserId(userId)

        return {
            success: true,
            message: 'Notification statistics retrieved successfully',
            data: NotificationStatsResponseDto.fromDomain(stats),
        }
    }
}
