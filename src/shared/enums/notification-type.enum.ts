// src/shared/enums/notification-type.enum.ts

/**
 * Notification Type Enum
 * Đồng bộ 100% với Prisma schema enum NotificationType
 */
export enum NotificationType {
    SYSTEM = 'SYSTEM',
    COURSE = 'COURSE',
    LESSON = 'LESSON',
    ATTENDANCE = 'ATTENDANCE',
    TUITION = 'TUITION',
    MESSAGE = 'MESSAGE',
    OTHER = 'OTHER',
}

/**
 * Notification Type Labels
 */
export const NotificationTypeLabels: Record<NotificationType, string> = {
    [NotificationType.SYSTEM]: 'Hệ thống',
    [NotificationType.COURSE]: 'Khoá học',
    [NotificationType.LESSON]: 'Bài học',
    [NotificationType.ATTENDANCE]: 'Điểm danh',
    [NotificationType.TUITION]: 'Học phí',
    [NotificationType.MESSAGE]: 'Tin nhắn',
    [NotificationType.OTHER]: 'Khác',
}

/**
 * Notification Type Descriptions
 */
export const NotificationTypeDescriptions: Record<NotificationType, string> = {
    [NotificationType.SYSTEM]: 'Thông báo từ hệ thống',
    [NotificationType.COURSE]: 'Thông báo liên quan đến khoá học',
    [NotificationType.LESSON]: 'Thông báo liên quan đến bài học',
    [NotificationType.ATTENDANCE]: 'Thông báo liên quan đến điểm danh',
    [NotificationType.TUITION]: 'Thông báo liên quan đến học phí',
    [NotificationType.MESSAGE]: 'Thông báo tin nhắn cá nhân',
    [NotificationType.OTHER]: 'Thông báo khác',
}

/**
 * Notification Type Colors
 */
export const NotificationTypeColors: Record<NotificationType, string> = {
    [NotificationType.SYSTEM]: 'gray',
    [NotificationType.COURSE]: 'blue',
    [NotificationType.LESSON]: 'indigo',
    [NotificationType.ATTENDANCE]: 'teal',
    [NotificationType.TUITION]: 'orange',
    [NotificationType.MESSAGE]: 'purple',
    [NotificationType.OTHER]: 'gray',
}

/**
 * Notification Type Icons
 */
export const NotificationTypeIcons: Record<NotificationType, string> = {
    [NotificationType.SYSTEM]: '⚙️',
    [NotificationType.COURSE]: '📚',
    [NotificationType.LESSON]: '📖',
    [NotificationType.ATTENDANCE]: '📝',
    [NotificationType.TUITION]: '💰',
    [NotificationType.MESSAGE]: '💬',
    [NotificationType.OTHER]: '🔔',
}
