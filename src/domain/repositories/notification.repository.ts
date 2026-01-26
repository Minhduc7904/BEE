// src/domain/repositories/notification.repository.ts
import { Notification } from '../entities'
import {
    CreateNotificationData,
    UpdateNotificationData,
    NotificationFilterOptions,
    NotificationPaginationOptions,
    NotificationListResult,
    NotificationStats,
} from '../interface/notification/notification.interface'

export interface INotificationRepository {
    create(data: CreateNotificationData): Promise<Notification>
    createMany(dataList: CreateNotificationData[]): Promise<Notification[]>
    findById(id: number): Promise<Notification | null>
    update(id: number, data: UpdateNotificationData): Promise<Notification>
    delete(id: number): Promise<boolean>
    findAll(): Promise<Notification[]>

    // Pagination methods
    findAllWithPagination(
        pagination: NotificationPaginationOptions,
        filters?: NotificationFilterOptions,
    ): Promise<NotificationListResult>

    // User-specific methods
    findByUserId(userId: number): Promise<Notification[]>
    findByUserIdWithPagination(
        userId: number,
        pagination: NotificationPaginationOptions,
        filters?: NotificationFilterOptions,
    ): Promise<NotificationListResult>

    // Bulk operations
    markAsRead(notificationId: number, userId: number): Promise<Notification>
    markAllAsRead(userId: number): Promise<number>
    deleteAllByUserId(userId: number): Promise<number>

    // Count methods
    count(filters?: NotificationFilterOptions): Promise<number>
    countByUserId(userId: number, filters?: NotificationFilterOptions): Promise<number>
    countUnreadByUserId(userId: number): Promise<number>

    // Stats methods
    getStatsByUserId(userId: number): Promise<NotificationStats>
}
