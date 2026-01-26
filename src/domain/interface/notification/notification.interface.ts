// src/domain/interface/notification/notification.interface.ts
import { NotificationType, NotificationLevel } from '../../../shared/enums'
import { Notification } from '../../entities'

export interface CreateNotificationData {
    userId: number
    title: string
    message: string
    type?: NotificationType
    level?: NotificationLevel
    data?: Record<string, any>
}

export interface UpdateNotificationData {
    title?: string
    message?: string
    type?: NotificationType
    level?: NotificationLevel
    isRead?: boolean
    data?: Record<string, any>
}

export interface NotificationFilterOptions {
    userId?: number
    type?: NotificationType
    level?: NotificationLevel
    isRead?: boolean
    search?: string
    fromDate?: Date
    toDate?: Date
    message?: string
}

export interface NotificationPaginationOptions {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface NotificationListResult {
    notifications: Notification[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface NotificationStats {
    total: number
    unread: number
    read: number
}
