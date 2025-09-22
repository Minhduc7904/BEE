import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString } from 'class-validator'
import { AuditStatus } from '../../../shared/enums'
import { IsEnumValue, Trim } from '../../../shared/decorators'
import { SWAGGER_PROPERTIES, VALIDATION_MESSAGES } from '../../../shared/constants'

export class CreateLogDto {
  @ApiProperty(SWAGGER_PROPERTIES.ACTION_KEY)
  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Key hành động') })
  actionKey: string

  @ApiProperty({
    ...SWAGGER_PROPERTIES.STATUS,
    enum: AuditStatus,
    example: AuditStatus.SUCCESS,
  })
  @Trim()
  @IsEnumValue(AuditStatus, { message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái') })
  status: AuditStatus

  @ApiPropertyOptional(SWAGGER_PROPERTIES.ERROR_MESSAGE)
  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Thông báo lỗi') })
  errorMessage?: string

  @ApiProperty(SWAGGER_PROPERTIES.RESOURCE_TYPE)
  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Loại tài nguyên') })
  resourceType: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RESOURCE_ID)
  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('ID tài nguyên') })
  resourceId?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.BEFORE_DATA)
  @Trim()
  @IsOptional()
  beforeData?: any

  @ApiPropertyOptional(SWAGGER_PROPERTIES.AFTER_DATA)
  @Trim()
  @IsOptional()
  afterData?: any

  @ApiProperty(SWAGGER_PROPERTIES.ADMIN_ID)
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_REQUIRED('ID admin') })
  adminId: number
}

export class LogResponseDto {
  @ApiProperty(SWAGGER_PROPERTIES.LOG_ID)
  logId: number

  @ApiProperty(SWAGGER_PROPERTIES.ACTION_KEY)
  actionKey: string

  @ApiProperty({
    ...SWAGGER_PROPERTIES.STATUS,
    enum: AuditStatus,
    example: AuditStatus.SUCCESS,
  })
  status: AuditStatus

  @ApiPropertyOptional(SWAGGER_PROPERTIES.ERROR_MESSAGE)
  errorMessage?: string

  @ApiProperty(SWAGGER_PROPERTIES.RESOURCE_TYPE)
  resourceType: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RESOURCE_ID)
  resourceId?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.BEFORE_DATA)
  beforeData?: any

  @ApiPropertyOptional(SWAGGER_PROPERTIES.AFTER_DATA)
  afterData?: any

  @ApiProperty(SWAGGER_PROPERTIES.CREATED_AT)
  createdAt: Date
}
