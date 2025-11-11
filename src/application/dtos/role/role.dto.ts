import { IsOptional, IsString, MaxLength, MinLength, IsBoolean, IsNumber, Min } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class CreateRoleDto {
  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên role') })
  @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN('Tên role', 2) })
  @MaxLength(50, { message: VALIDATION_MESSAGES.FIELD_MAX('Tên role', 50) })
  roleName: string

  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mô tả role') })
  @MaxLength(255, { message: VALIDATION_MESSAGES.FIELD_MAX('Mô tả', 255) })
  description?: string

  @IsOptional()
  @IsBoolean()
  isAssignable?: boolean

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Role ID phải lớn hơn 0' })
  requiredByRoleId?: number
}

export class UpdateRoleDto {
  @Trim()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  roleName?: string

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string

  @IsOptional()
  @IsBoolean()
  isAssignable?: boolean

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Role ID phải lớn hơn 0' })
  requiredByRoleId?: number
}

export class RoleResponseDto {
  roleId: number

  roleName: string

  description?: string

  isAssignable: boolean

  requiredByRoleId?: number

  createdAt: Date

  requiredByRole?: RoleResponseDto

  childRoles?: RoleResponseDto[]
}
