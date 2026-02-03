import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { IsRequiredString, IsOptionalString, IsOptionalBoolean, IsOptionalIntArray, IsRequiredIntArray } from 'src/shared/decorators/validate'
import { ArrayMinSize } from 'class-validator'

/**
 * DTO tạo role mới
 * @description Chứa thông tin để tạo một role mới trong hệ thống
 */
export class CreateRoleDto {
  /**
   * Tên role (2-50 ký tự)
   * @required
   * @example "ADMIN"
   */
  @IsRequiredString('Tên role', 50, 2)
  roleName: string

  /**
   * Mô tả role (tối đa 255 ký tự)
   * @optional
   * @example "Quản trị viên hệ thống"
   */
  @IsOptionalString('Mô tả role', 255)
  description?: string

  /**
   * Có thể gán cho người dùng không
   * @optional
   * @example true
   */
  @IsOptionalBoolean('Có thể gán')
  isAssignable?: boolean

  /**
   * Danh sách ID các quyền
   * @optional
   * @example [1, 2, 3]
   */
  @IsOptionalIntArray('Danh sách quyền')
  permissionIds?: number[]
}

/**
 * DTO cập nhật role
 * @description Chứa các trường có thể cập nhật của role
 */
export class UpdateRoleDto {
  /**
   * Tên role (2-50 ký tự)
   * @optional
   * @example "ADMIN"
   */
  @IsOptionalString('Tên role', 50, 2)
  roleName?: string

  /**
   * Mô tả (tối đa 255 ký tự)
   * @optional
   * @example "Quản trị viên hệ thống"
   */
  @IsOptionalString('Mô tả', 255)
  description?: string

  /**
   * Có thể gán
   * @optional
   * @example true
   */
  @IsOptionalBoolean('Có thể gán')
  isAssignable?: boolean

  /**
   * Danh sách ID quyền
   * @optional
   * @example [1, 2, 3]
   */
  @IsOptionalIntArray('Danh sách quyền')
  permissionIds?: number[]
}

/**
 * DTO gán quyền cho role
 * @description Chứa danh sách ID các quyền cần gán
 */
export class AssignPermissionsToRoleDto {
  /**
   * Danh sách ID quyền (tối thiểu 1)
   * @required
   * @example [1, 2, 3]
   */
  @ArrayMinSize(1, { message: 'Cần ít nhất 1 permission' })
  @IsRequiredIntArray('Danh sách quyền')
  permissionIds: number[]
}

export class RoleResponseDto {
  roleId: number

  roleName: string

  description?: string

  isAssignable: boolean

  createdAt: Date

  permissionsCount?: number

  permissions?: { permissionId: number; code: string; name: string }[]

  requiredByRole?: RoleResponseDto

  childRoles?: RoleResponseDto[]
}

export class RoleWithPermissionsResponseDto {
  roleId: number
  roleName: string
  description?: string
  permissions: {
    permissionId: number
    code: string
    name: string
    group?: string
  }[]

  constructor(partial: Partial<RoleWithPermissionsResponseDto>) {
    Object.assign(this, partial)
  }

  static fromRoleWithPermissions(role: any): RoleWithPermissionsResponseDto {
    return new RoleWithPermissionsResponseDto({
      roleId: role.roleId,
      roleName: role.roleName,
      description: role.description,
      permissions: role.rolePermissions?.map((rp: any) => ({
        permissionId: rp.permission.permissionId,
        code: rp.permission.code,
        name: rp.permission.name,
        group: rp.permission.group,
      })) || [],
    })
  }
}
