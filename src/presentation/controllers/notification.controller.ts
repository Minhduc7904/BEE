// src/presentation/controllers/notification.controller.ts
import { Controller, Get, Delete, Put, Post, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { NotificationListQueryDto } from '../../application/dtos/notification/notification-list-query.dto'
import { SendNotificationDto } from '../../application/dtos/notification/send-notification.dto'
import { NotificationListResponseDto, NotificationResponseDto, NotificationStatsResponseDto } from '../../application/dtos/notification/notification.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import {
    GetMyNotificationsUseCase,
    GetUserNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    GetNotificationStatsUseCase,
    DeleteNotificationUseCase,
    SendNotificationUseCase,
} from '../../application/use-cases/notification'
import { Injectable } from '@nestjs/common'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Injectable()
@Controller('notifications')
export class NotificationController {
    constructor(
        private readonly getMyNotificationsUseCase: GetMyNotificationsUseCase,
        private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
        private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
        private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
        private readonly getNotificationStatsUseCase: GetNotificationStatsUseCase,
        private readonly deleteNotificationUseCase: DeleteNotificationUseCase,
        private readonly sendNotificationUseCase: SendNotificationUseCase,
    ) { }

    /**
     * Get all notifications for the current user
     * 
     * @route GET /notifications/my
     * @permission notification.getMy
     * @returns Paginated list of user's notifications
     * 
     * @example
     * GET /notifications/my?page=1&limit=20&isRead=false
     */
    @Get('my')
    @RequirePermission(PERMISSION_CODES.NOTIFICATION_GET_MY)
    @HttpCode(HttpStatus.OK)
    async getMyNotifications(
        @Query() query: NotificationListQueryDto,
        @CurrentUser('userId') userId: number,
    ): Promise<NotificationListResponseDto> {
        return ExceptionHandler.execute(() => this.getMyNotificationsUseCase.execute(userId, query))
    }

    /**
     * Get notification statistics for the current user
     * 
     * @route GET /notifications/my/stats
     * @permission notification.getMy
     * @returns Total, unread, and read notification counts
     * 
     * @example
     * GET /notifications/my/stats
     */
    @Get('my/stats')
    @RequirePermission(PERMISSION_CODES.NOTIFICATION_GET_MY)
    @HttpCode(HttpStatus.OK)
    async getMyNotificationStats(
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<NotificationStatsResponseDto>> {
        return ExceptionHandler.execute(() => this.getNotificationStatsUseCase.execute(userId))
    }

    /**
     * Mark all notifications as read for the current user
     * 
     * @route PUT /notifications/my/mark-all-read
     * @permission notification.markRead
     * @returns Count of notifications marked as read
     * 
     * @example
     * PUT /notifications/my/mark-all-read
     */
    @Put('my/mark-all-read')
    @RequirePermission(PERMISSION_CODES.NOTIFICATION_MARK_READ)
    @HttpCode(HttpStatus.OK)
    async markAllNotificationsRead(
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<{ count: number }>> {
        return ExceptionHandler.execute(() => this.markAllNotificationsReadUseCase.execute(userId))
    }

    /**
     * Get all notifications for a specific user (admin only)
     * 
     * @route GET /notifications/user/:userId
     * @permission notification.getByUserId
     * @param userId - Target user ID
     * @returns Paginated list of user's notifications
     * 
     * @example
     * GET /notifications/user/123?page=1&limit=20
     */
    @Get('user/:userId')
    @RequirePermission(PERMISSION_CODES.NOTIFICATION_GET_BY_USER_ID)
    @HttpCode(HttpStatus.OK)
    async getUserNotifications(
        @Param('userId', ParseIntPipe) targetUserId: number,
        @Query() query: NotificationListQueryDto,
    ): Promise<NotificationListResponseDto> {
        return ExceptionHandler.execute(() => this.getUserNotificationsUseCase.execute(targetUserId, query))
    }

    /**
     * Mark a specific notification as read
     * 
     * @route PUT /notifications/:id/mark-read
     * @permission notification.markRead
     * @param id - Notification ID
     * @returns Updated notification
     * 
     * @example
     * PUT /notifications/123/mark-read
     */
    @Put(':id/mark-read')
    @RequirePermission(PERMISSION_CODES.NOTIFICATION_MARK_READ)
    @HttpCode(HttpStatus.OK)
    async markNotificationRead(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<NotificationResponseDto>> {
        return ExceptionHandler.execute(() => this.markNotificationReadUseCase.execute(id, userId))
    }

    /**
     * Delete a specific notification
     * 
     * @route DELETE /notifications/:id
     * @permission notification.delete
     * @param id - Notification ID
     * @returns Success response
     * 
     * @example
     * DELETE /notifications/123
     */
    @Delete(':id')
    @RequirePermission(PERMISSION_CODES.NOTIFICATION_DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteNotification(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteNotificationUseCase.execute(id, userId))
    }

    /**
     * Send notification to multiple users
     * 
     * @route POST /notifications/send
     * @permission notification.send
     * @body SendNotificationDto - Notification content and recipients
     * @returns Count of notifications sent
     * 
     * @example
     * POST /notifications/send
     * Body: {
     *   "title": "System Maintenance",
     *   "message": "Server will be down for maintenance",
     *   "type": "SYSTEM",
     *   "level": "WARNING",
     *   "userIds": [1, 2, 3]  // Option 1: Specific users
     * }
     * 
     * OR
     * Body: {
     *   "title": "New Course Available",
     *   "message": "Check out our latest course",
     *   "role": "STUDENT"  // Option 2: All users with role
     * }
     * 
     * OR
     * Body: {
     *   "title": "System Update",
     *   "message": "Important update for all users",
     *   "all": true  // Option 3: All users
     * }
     */
    @Post('send')
    @RequirePermission(PERMISSION_CODES.NOTIFICATION_SEND)
    @HttpCode(HttpStatus.OK)
    async sendNotification(
        @Body() dto: SendNotificationDto,
        @CurrentUser('adminId') adminId?: number,
    ): Promise<BaseResponseDto<{ count: number }>> {
        return ExceptionHandler.execute(() => this.sendNotificationUseCase.execute(dto, adminId))
    }
}

