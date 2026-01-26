// src/shared/enums/notification-level.enum.ts

/**
 * Notification Level Enum
 * Đồng bộ 100% với Prisma schema enum NotificationLevel
 */
export enum NotificationLevel {
    INFO = 'INFO',
    SUCCESS = 'SUCCESS',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
}

/**
 * Notification Level Labels
 */
export const NotificationLevelLabels: Record<NotificationLevel, string> = {
    [NotificationLevel.INFO]: 'Thông tin',
    [NotificationLevel.SUCCESS]: 'Thành công',
    [NotificationLevel.WARNING]: 'Cảnh báo',
    [NotificationLevel.ERROR]: 'Lỗi',
}

/**
 * Notification Level Descriptions
 */
export const NotificationLevelDescriptions: Record<NotificationLevel, string> = {
    [NotificationLevel.INFO]: 'Thông báo thông tin chung',
    [NotificationLevel.SUCCESS]: 'Thông báo thao tác thành công',
    [NotificationLevel.WARNING]: 'Thông báo cảnh báo cần chú ý',
    [NotificationLevel.ERROR]: 'Thông báo lỗi nghiêm trọng',
}

/**
 * Notification Level Colors
 */
export const NotificationLevelColors: Record<NotificationLevel, string> = {
    [NotificationLevel.INFO]: 'blue',
    [NotificationLevel.SUCCESS]: 'green',
    [NotificationLevel.WARNING]: 'orange',
    [NotificationLevel.ERROR]: 'red',
}

/**
 * Notification Level Icons
 */
export const NotificationLevelIcons: Record<NotificationLevel, string> = {
    [NotificationLevel.INFO]: 'ℹ️',
    [NotificationLevel.SUCCESS]: '✅',
    [NotificationLevel.WARNING]: '⚠️',
    [NotificationLevel.ERROR]: '❌',
}
