import { IsEnum, IsOptional } from 'class-validator'
import { IsOptionalInt, IsRequiredString } from '../../../shared/decorators/validate'
import { NotificationRecipientType } from '../../../shared/enums'

export class NotificationRecipientSearchQueryDto {
  @IsEnum(NotificationRecipientType)
  recipientType: NotificationRecipientType

  @IsRequiredString('Từ khóa tìm kiếm', 255, 2)
  search: string

  @IsOptionalInt('Số trang', 1, 1000)
  page?: number = 1

  @IsOptionalInt('Kích thước trang', 1, 100)
  limit?: number = 20

  @IsOptional()
  @IsOptionalInt('Khối', 1, 12)
  grade?: number
}
