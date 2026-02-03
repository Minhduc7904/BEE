// src/application/dtos/notification/notification-list-query.dto.ts
import { IsOptionalInt, IsOptionalEnumValue, IsOptionalBoolean, IsOptionalString, IsOptionalDate } from 'src/shared/decorators/validate'
import { IsIn } from 'class-validator'
import { NotificationType, NotificationLevel } from '../../../shared/enums'

/**
 * DTO for querying notification list
 * 
 * @description Used to query and filter notifications with pagination and sorting
 */
export class NotificationListQueryDto {
  /**
   * Page number (min: 1)
   * @optional
   * @default 1
   * @example 1
   */
  @IsOptionalInt('Số trang', 1)
  page?: number = 1

  /**
   * Items per page (min: 1)
   * @optional
   * @default 20
   * @example 20
   */
  @IsOptionalInt('Số lượng/trang', 1)
  limit?: number = 20

  /**
   * Sort by field
   * @optional
   * @default 'createdAt'
   * @example 'createdAt'
   */
  @IsOptionalString('Sắp xếp theo')
  sortBy?: string = 'createdAt'

  /**
   * Sort order
   * @optional
   * @default 'desc'
   * @example 'asc'
   */
  @IsOptionalString('Thứ tự sắp xếp')
  @IsIn(['asc', 'desc'], { message: 'Thứ tự sắp xếp phải là asc hoặc desc' })
  sortOrder?: 'asc' | 'desc' = 'desc'

  /**
   * Filter by notification type
   * @optional
   * @example NotificationType.SYSTEM
   */
  @IsOptionalEnumValue(NotificationType, 'Loại thông báo')
  type?: NotificationType

  /**
   * Filter by notification level
   * @optional
   * @example NotificationLevel.INFO
   */
  @IsOptionalEnumValue(NotificationLevel, 'Mức độ')
  level?: NotificationLevel

  /**
   * Filter by read status
   * @optional
   * @example true
   */
  @IsOptionalBoolean('Đã đọc')
  isRead?: boolean

  /**
   * Search keyword
   * @optional
   * @example 'payment'
   */
  @IsOptionalString('Từ khóa tìm kiếm')
  search?: string

  /**
   * Filter from date
   * @optional
   * @example new Date('2024-01-01')
   */
  @IsOptionalDate('Từ ngày')
  fromDate?: Date

  /**
   * Filter to date
   * @optional
   * @example new Date('2024-12-31')
   */
  @IsOptionalDate('Đến ngày')
  toDate?: Date
}
