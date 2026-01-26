// src/application/dtos/notification/send-notification.dto.ts
import { IsString, IsOptional, IsArray, IsInt, IsEnum, IsObject, ValidateIf } from 'class-validator'
import { NotificationType, NotificationLevel } from '../../../shared/enums'
import { ROLE_NAMES } from '../../../shared/constants/roles.constant'

export class SendNotificationDto {
    @IsString()
    title: string

    @IsString()
    message: string

    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType

    @IsOptional()
    @IsEnum(NotificationLevel)
    level?: NotificationLevel

    @IsOptional()
    @IsObject()
    data?: Record<string, any>

    // Recipients - chỉ 1 trong 3
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @ValidateIf((o) => !o.role && !o.all)
    userIds?: number[]

    @IsOptional()
    @IsEnum(ROLE_NAMES)
    @ValidateIf((o) => !o.userIds && !o.all)
    role?: keyof typeof ROLE_NAMES

    @IsOptional()
    @ValidateIf((o) => !o.userIds && !o.role)
    all?: boolean
}
