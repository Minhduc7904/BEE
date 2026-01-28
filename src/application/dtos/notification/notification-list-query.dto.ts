// src/application/dtos/notification/notification-list-query.dto.ts
import { IsOptional, IsEnum, IsInt, Min, IsString, IsBoolean } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { NotificationType, NotificationLevel } from '../../../shared/enums'
import { ToNumber } from 'src/shared/decorators'

export class NotificationListQueryDto {
    @IsOptional()
    @ToNumber()
    @IsInt()
    @Min(1)
    page?: number = 1

    @IsOptional()
    @ToNumber()
    @IsInt()
    @Min(1)
    limit?: number = 20

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt'

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc'

    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType

    @IsOptional()
    @IsEnum(NotificationLevel)
    level?: NotificationLevel

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isRead?: boolean

    @IsOptional()
    @IsString()
    search?: string

    @IsOptional()
    @Type(() => Date)
    fromDate?: Date

    @IsOptional()
    @Type(() => Date)
    toDate?: Date
}
