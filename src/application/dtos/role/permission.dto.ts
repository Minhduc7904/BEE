import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class CreatePermissionDto {
  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Mã permission') })
  @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN('Mã permission', 2) })
  @MaxLength(100, { message: VALIDATION_MESSAGES.FIELD_MAX('Mã permission', 100) })
  code: string

  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên permission') })
  @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN('Tên permission', 2) })
  @MaxLength(100, { message: VALIDATION_MESSAGES.FIELD_MAX('Tên permission', 100) })
  name: string

  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mô tả') })
  @MaxLength(255, { message: VALIDATION_MESSAGES.FIELD_MAX('Mô tả', 255) })
  description?: string

  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Nhóm') })
  @MaxLength(50, { message: VALIDATION_MESSAGES.FIELD_MAX('Nhóm', 50) })
  group?: string

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean
}

export class UpdatePermissionDto {
  @Trim()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  code?: string

  @Trim()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  group?: string

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean
}

export class PermissionResponseDto {
  permissionId: number
  code: string
  name: string
  description?: string
  group?: string
  isSystem: boolean
  createdAt: Date

  constructor(partial: Partial<PermissionResponseDto>) {
    Object.assign(this, partial)
  }

  static fromPermission(permission: any): PermissionResponseDto {
    return new PermissionResponseDto({
      permissionId: permission.permissionId,
      code: permission.code,
      name: permission.name,
      description: permission.description,
      group: permission.group,
      isSystem: permission.isSystem,
      createdAt: permission.createdAt,
    })
  }
}
