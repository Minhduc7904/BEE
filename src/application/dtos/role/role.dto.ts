import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsBoolean,
  IsArray,
  IsNumber,
  ArrayMinSize,
} from 'class-validator'
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
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds?: number[]
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
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds?: number[]
}

export class AssignPermissionsToRoleDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Cần ít nhất 1 permission' })
  @IsNumber({}, { each: true })
  permissionIds: number[]
}

export class RoleResponseDto {
  roleId: number

  roleName: string

  description?: string

  isAssignable: boolean

  createdAt: Date

  permissions?: { permissionId: number; code: string; name: string }[]

  requiredByRole?: RoleResponseDto

  childRoles?: RoleResponseDto[]
}
