import { IsOptional, IsNumber, Min, IsDateString, IsBoolean } from 'class-validator'
import { RoleResponseDto } from './role.dto'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class AssignUserRoleDto {
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_REQUIRED('User ID') })
  @Min(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('User ID', 1) })
  userId: number

  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_REQUIRED('Role ID') })
  @Min(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Role ID', 1) })
  roleId: number

  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Thời gian hết hạn') })
  expiresAt?: string
}

export class UpdateUserRoleDto {
  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Thời gian hết hạn') })
  expiresAt?: string

  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái active') })
  isActive?: boolean
}

export class UserRoleResponseDto {
  userId: number

  roleId: number

  assignedAt: Date

  expiresAt?: Date

  assignedBy?: number

  isActive: boolean
}

export class UserRoleListResponseDto {
  data: UserRoleResponseDto[]

  total: number

  page: number

  limit: number
}
