// src/domain/entities/notification/notification.entity.ts

import { NotificationType, NotificationLevel } from '../../../shared/enums'

/**
 * Notification Entity
 * Domain entity đại diện cho 1 thông báo của người dùng
 */
export class Notification {
    // Required properties
    notificationId: number
    userId: number
    title: string
    message: string
    type: NotificationType
    level: NotificationLevel
    isRead: boolean
    createdAt: Date

    // Optional properties
    data?: Record<string, any>
    readAt?: Date

    constructor(data: {
        notificationId: number
        userId: number
        title: string
        message: string
        type?: NotificationType
        level?: NotificationLevel
        isRead?: boolean
        createdAt?: Date
        data?: Record<string, any>
        readAt?: Date
    }) {
        this.notificationId = data.notificationId
        this.userId = data.userId
        this.title = data.title
        this.message = data.message

        this.type = data.type ?? NotificationType.SYSTEM
        this.level = data.level ?? NotificationLevel.INFO

        this.isRead = data.isRead ?? false
        this.createdAt = data.createdAt ?? new Date()

        this.data = data.data
        this.readAt = data.readAt
    }

    /* ===================== BUSINESS METHODS ===================== */

    /**
     * Đánh dấu notification là đã đọc
     */
    markAsRead(): void {
        if (!this.isRead) {
            this.isRead = true
            this.readAt = new Date()
        }
    }

    /**
     * Kiểm tra notification đã đọc chưa
     */
    isUnread(): boolean {
        return !this.isRead
    }

    /**
     * Kiểm tra notification có phải loại system không
     */
    isSystem(): boolean {
        return this.type === NotificationType.SYSTEM
    }

    /**
     * Kiểm tra notification có mức độ nghiêm trọng không
     */
    isCritical(): boolean {
        return this.level === NotificationLevel.ERROR
    }

    /**
     * Lấy entity liên quan (nếu có)
     * Ví dụ: lessonId, courseId, attendanceId...
     */
    getRelatedEntity(): { entity: string; entityId: number } | null {
        if (!this.data?.entity || !this.data?.entityId) {
            return null
        }

        return {
            entity: this.data.entity,
            entityId: Number(this.data.entityId),
        }
    }

    /**
     * Lấy URL điều hướng từ notification (nếu có)
     */
    getRedirectUrl(): string | null {
        return this.data?.url ?? null
    }

    /**
     * Kiểm tra notification có thể điều hướng không
     */
    isNavigable(): boolean {
        return Boolean(this.getRedirectUrl())
    }

    /**
     * So sánh 2 notification
     */
    equals(other: Notification): boolean {
        return this.notificationId === other.notificationId
    }

    toJSON() {
        return {
            notificationId: this.notificationId,
            userId: this.userId,
            title: this.title,
            message: this.message,
            type: this.type,
            level: this.level,
            isRead: this.isRead,
            readAt: this.readAt,
            data: this.data,
            createdAt: this.createdAt,
        }
    }

    clone(): Notification {
        return new Notification({
            notificationId: this.notificationId,
            userId: this.userId,
            title: this.title,
            message: this.message,
            type: this.type,
            level: this.level,
            isRead: this.isRead,
            readAt: this.readAt,
            data: this.data,
            createdAt: this.createdAt,
        })
    }
}
