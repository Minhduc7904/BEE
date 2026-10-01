import { NotificationType } from '../../../shared/enums'
import {
  IsOptionalBoolean,
  IsOptionalEnumValue,
  IsOptionalIdNumber,
  IsOptionalInt,
  IsOptionalResultCursor,
} from '../../../shared/decorators/validate'
import { decodeParentNotificationCursor, ParentNotificationCursor } from '../../interfaces'
import { ValidationException } from '../../../shared/exceptions/custom-exceptions'

export class ParentNotificationInboxQueryDto {
  @IsOptionalIdNumber('Học sinh')
  studentId?: number

  @IsOptionalEnumValue(NotificationType, 'Loại thông báo')
  type?: NotificationType

  @IsOptionalBoolean('Trạng thái đã đọc')
  isRead?: boolean

  @IsOptionalResultCursor('Con trỏ phân trang')
  after?: string

  @IsOptionalInt('Kích thước trang', 1, 100)
  limit?: number = 20

  toPagination(): { after: ParentNotificationCursor | null; limit: number } {
    let after: ParentNotificationCursor | null = null
    try {
      after = this.after ? decodeParentNotificationCursor(this.after) : null
    } catch {
      throw new ValidationException('Con trỏ phân trang không hợp lệ')
    }
    return {
      after,
      limit: Math.min(100, Math.max(1, this.limit ?? 20)),
    }
  }
}
