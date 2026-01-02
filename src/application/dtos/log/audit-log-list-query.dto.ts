// src/application/dtos/log/audit-log-list-query.dto.ts
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator'
import { Type } from 'class-transformer'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { ListQueryDto } from '../pagination/list-query.dto'

export class AuditLogListQueryDto extends ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('ID Admin') })
  adminId?: number

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Action Key') })
  @Trim()
  actionKey?: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Resource Type') })
  @Trim()
  resourceType?: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Resource ID') })
  @Trim()
  resourceId?: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Status') })
  @Trim()
  status?: string
}
