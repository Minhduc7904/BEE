// src/application/dtos/admin/admin-response.dto.ts
import { UserResponseDto, UpdateUserDto } from '..'
import { IsOptional, IsNumber, IsPositive } from 'class-validator'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { RoleWithPermissionsResponseDto } from '../role/role.dto'

export class AdminResponseDto extends UserResponseDto {
  adminId: number

  subjectId?: number

  subject?: string

  roles?: RoleWithPermissionsResponseDto[]

  constructor(partial: Partial<AdminResponseDto>) {
    super(partial)
    Object.assign(this, partial)
  }

  /**
   * Factory method tạo từ User entity với Admin details
   */
  static fromUserWithAdmin(user: any, admin: any): AdminResponseDto {
    const baseUser = UserResponseDto.fromUser(user)

    return new AdminResponseDto({
      ...baseUser,
      adminId: admin.adminId,
      subjectId: admin.subjectId,
      subject: admin.getSubjectName ? admin.getSubjectName() : admin.subject?.name,
      roles: user.userRoles
        ? user.userRoles
          .filter((ur: any) => {
            const now = new Date()
            const isActive = ur.isActive
            const notExpired = !ur.expiresAt || new Date(ur.expiresAt) > now
            return isActive && notExpired
          })
          .map((ur: any) => RoleWithPermissionsResponseDto.fromRoleWithPermissions(ur.role))
        : [],
    })
  }

  /**
   * Factory method tạo từ User entity có include admin
   */
  static fromUserEntity(userWithAdmin: any): AdminResponseDto {
    if (!userWithAdmin.admin) {
      throw new Error('User entity must include admin details')
    }

    return AdminResponseDto.fromUserWithAdmin(userWithAdmin, userWithAdmin.admin)
  }
}

export class UpdateAdminDto extends UpdateUserDto {
  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Subject ID') })
  @IsPositive({ message: 'Subject ID phải là số dương' })
  subjectId?: number
}
