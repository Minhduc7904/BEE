import { IsRequiredString, IsOptionalString, IsOptionalBoolean } from 'src/shared/decorators/validate'

/**
 * DTO for creating permission
 * 
 * @description Used to create a new permission in the system
 */
export class CreatePermissionDto {
  /**
   * Permission code (2-100 characters)
   * @required
   * @example 'user.create'
   */
  @IsRequiredString('Mã permission', 100, 2)
  code: string

  /**
   * Permission name (2-100 characters)
   * @required
   * @example 'Create User'
   */
  @IsRequiredString('Tên permission', 100, 2)
  name: string

  /**
   * Permission description
   * @optional
   * @example 'Allows creating new users'
   */
  @IsOptionalString('Mô tả', 255)
  description?: string

  /**
   * Permission group
   * @optional
   * @example 'User Management'
   */
  @IsOptionalString('Nhóm', 50)
  group?: string

  /**
   * Is system permission (cannot be deleted)
   * @optional
   * @default false
   * @example false
   */
  @IsOptionalBoolean('Là permission hệ thống')
  isSystem?: boolean
}

/**
 * DTO for updating permission
 * 
 * @description Used to update an existing permission
 */
export class UpdatePermissionDto {
  /**
   * Permission code (2-100 characters)
   * @optional
   * @example 'user.update'
   */
  @IsOptionalString('Mã permission', 100, 2)
  code?: string

  /**
   * Permission name (2-100 characters)
   * @optional
   * @example 'Update User'
   */
  @IsOptionalString('Tên permission', 100, 2)
  name?: string

  /**
   * Permission description
   * @optional
   * @example 'Allows updating user information'
   */
  @IsOptionalString('Mô tả', 255)
  description?: string

  /**
   * Permission group
   * @optional
   * @example 'User Management'
   */
  @IsOptionalString('Nhóm', 50)
  group?: string

  /**
   * Is system permission
   * @optional
   * @example false
   */
  @IsOptionalBoolean('Là permission hệ thống')
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
