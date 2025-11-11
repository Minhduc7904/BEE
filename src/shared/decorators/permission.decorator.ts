// src/shared/decorators/permission.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../guards/auth.guard'
import { RolesGuard } from '../guards/roles.guard'
import { RequireRoles } from './roles.decorator'
import { ErrorResponseDto } from '../../application/dtos/common/error-response.dto'
import { ROLE_NAMES, ADMIN_ROLES, CONTENT_CREATOR_ROLES } from '../constants/roles.constant'
import { HttpStatus } from '@nestjs/common'

/**
 * Decorator tổng hợp để áp dụng authentication và authorization
 */
export function RequireAuth(...roles: string[]) {
  return applyDecorators(
    UseGuards(AuthGuard, RolesGuard),
    RequireRoles(...roles),
  )
}

/**
 * Chỉ cho phép ADMIN truy cập (SUPER_ADMIN tự động có quyền)
 */
export function AdminOnly() {
  return RequireAuth(ROLE_NAMES.ADMIN)
}

/**
 * Cho phép các role quản trị truy cập
 */
export function AdminRoles() {
  return RequireAuth(...ADMIN_ROLES)
}

/**
 * Cho phép các role có thể tạo nội dung truy cập
 */
export function ContentCreatorRoles() {
  return RequireAuth(...CONTENT_CREATOR_ROLES)
}

/**
 * Chỉ cho phép TEACHER truy cập (SUPER_ADMIN tự động có quyền)
 */
export function TeacherOnly() {
  return RequireAuth(ROLE_NAMES.TEACHER)
}

/**
 * Chỉ cho phép STUDENT truy cập (SUPER_ADMIN tự động có quyền)
 */
export function StudentOnly() {
  return RequireAuth(ROLE_NAMES.STUDENT)
}

/**
 * Cho phép TEACHER hoặc STUDENT truy cập (SUPER_ADMIN tự động có quyền)
 */
export function TeacherOrStudent() {
  return RequireAuth(ROLE_NAMES.TEACHER, ROLE_NAMES.STUDENT)
}

/**
 * Cho phép ADMIN hoặc TEACHER truy cập (SUPER_ADMIN tự động có quyền)
 */
export function AdminOrTeacher() {
  return RequireAuth(ROLE_NAMES.ADMIN, ROLE_NAMES.TEACHER)
}

/**
 * Cho phép tất cả các role truy cập (SUPER_ADMIN tự động có quyền)
 */
export function AllRoles() {
  return RequireAuth(ROLE_NAMES.ADMIN, ROLE_NAMES.TEACHER, ROLE_NAMES.STUDENT)
}

/**
 * Custom decorator cho bất kỳ combination nào
 */
export function AnyOf(...roles: string[]) {
  return RequireAuth(...roles)
}

/**
 * Chỉ yêu cầu authentication, không có role requirement
 */
export function AuthOnly() {
  return applyDecorators(
    UseGuards(AuthGuard),
  )
}
