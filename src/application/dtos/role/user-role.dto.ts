import { IsRequiredIdNumber, IsOptionalDate, IsOptionalBoolean } from 'src/shared/decorators/validate'
import { NotEquals } from 'class-validator'
import { RoleWithPermissionsResponseDto } from './role.dto'
import { PermissionResponseDto } from './permission.dto'

/**
 * DTO for assigning role to user
 * 
 * @description Used to assign a role to a user with optional expiration
 */
export class AssignUserRoleDto {
  /**
   * User ID to assign role to
   * @required
   * @example 10
   */
  @IsRequiredIdNumber('ID người dùng')
  userId: number

  /**
   * Role ID to assign (cannot be 1 - system role)
   * @required
   * @example 5
   */
  @IsRequiredIdNumber('ID vai trò')
  @NotEquals(1, { message: 'Không được gán role hệ thống (roleId = 1)' })
  roleId: number

  /**
   * Role expiration date
   * @optional
   * @example '2024-12-31T23:59:59Z'
   */
  @IsOptionalDate('Thời gian hết hạn')
  expiresAt?: string
}

/**
 * DTO for updating user role assignment
 * 
 * @description Used to update role expiration or activation status
 */
export class UpdateUserRoleDto {
  /**
   * Role expiration date
   * @optional
   * @example '2024-12-31T23:59:59Z'
   */
  @IsOptionalDate('Thời gian hết hạn')
  expiresAt?: string

  /**
   * Active status
   * @optional
   * @example true
   */
  @IsOptionalBoolean('Trạng thái kích hoạt')
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

export class UserRoleWithPermissionsResponseDto extends UserRoleResponseDto {
  role?: RoleWithPermissionsResponseDto

  permissions: PermissionResponseDto[]
}
