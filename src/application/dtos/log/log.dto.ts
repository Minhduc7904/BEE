import { IsNumber, IsOptional, IsString } from 'class-validator'
import { AuditStatus } from '../../../shared/enums'
import { IsEnumValue, Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class CreateLogDto {
    @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Key hành động') })
  actionKey: string

    @Trim()
  @IsEnumValue(AuditStatus, { message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái') })
  status: AuditStatus

    @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Thông báo lỗi') })
  errorMessage?: string

    @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Loại tài nguyên') })
  resourceType: string

    @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('ID tài nguyên') })
  resourceId?: string

    @Trim()
  @IsOptional()
  beforeData?: any

    @Trim()
  @IsOptional()
  afterData?: any

    @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_REQUIRED('ID admin') })
  adminId: number
}

export class LogResponseDto {
    logId: number

    actionKey: string

    status: AuditStatus

    errorMessage?: string

    resourceType: string

    resourceId?: string

    beforeData?: any

    afterData?: any

    createdAt: Date
}
