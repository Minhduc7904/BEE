// src/application/dtos/notification/send-notification.dto.ts
import { IsRequiredString, IsOptionalEnumValue, IsOptionalIntArray, IsOptionalBoolean } from 'src/shared/decorators/validate'
import { IsOptional, IsObject, IsEnum, ValidateIf } from 'class-validator'
import { NotificationType, NotificationLevel } from '../../../shared/enums'
import { ROLE_NAMES } from '../../../shared/constants/roles.constant'

/**
 * DTO for sending notification
 * 
 * @description Used to send notifications to users. Can target specific users, a role, or all users
 */
export class SendNotificationDto {
    /**
     * Notification title
     * @required
     * @example 'New Course Available'
     */
    @IsRequiredString('Tiêu đề thông báo')
    title: string

    /**
     * Notification message content
     * @required
     * @example 'A new course on Math has been added to your curriculum'
     */
    @IsRequiredString('Nội dung thông báo')
    message: string

    /**
     * Notification type
     * @optional
     * @example NotificationType.COURSE
     */
    @IsOptionalEnumValue(NotificationType, 'Loại thông báo')
    type?: NotificationType

    /**
     * Notification level (priority)
     * @optional
     * @example NotificationLevel.INFO
     */
    @IsOptionalEnumValue(NotificationLevel, 'Mức độ')
    level?: NotificationLevel

    /**
     * Additional data payload
     * @optional
     * @example { courseId: 123, action: 'view' }
     */
    @IsOptional()
    @IsObject()
    data?: Record<string, any>

    /**
     * List of user IDs to send to (mutually exclusive with role and all)
     * @optional
     * @example [1, 2, 3, 4, 5]
     */
    @IsOptionalIntArray('Danh sách ID người dùng')
    @ValidateIf((o) => !o.role && !o.all)
    userIds?: number[]

    /**
     * Role to send to (mutually exclusive with userIds and all)
     * @optional
     * @example 'STUDENT'
     */
    @IsOptional()
    @IsEnum(ROLE_NAMES)
    @ValidateIf((o) => !o.userIds && !o.all)
    role?: keyof typeof ROLE_NAMES

    /**
     * Send to all users (mutually exclusive with userIds and role)
     * @optional
     * @default false
     * @example true
     */
    @IsOptionalBoolean('Gửi cho tất cả')
    @ValidateIf((o) => !o.userIds && !o.role)
    all?: boolean
}
