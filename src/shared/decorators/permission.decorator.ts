// src/shared/decorators/permission.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { RequireRoles } from './roles.decorator';
import { ErrorResponseDto } from '../../application/dtos/common/error-response.dto';
import { ROLE_NAMES, ADMIN_ROLES, CONTENT_CREATOR_ROLES } from '../constants/roles.constant';
import { HttpStatus } from '@nestjs/common';

/**
 * Decorator tổng hợp để áp dụng authentication và authorization
 */
export function RequireAuth(...roles: string[]) {
    return applyDecorators(
        UseGuards(AuthGuard, RolesGuard),
        RequireRoles(...roles),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            status: HttpStatus.UNAUTHORIZED,
            description: 'Không có token hoặc token không hợp lệ',
            type: ErrorResponseDto,
            example: {
                success: false,
                message: 'Không có token hoặc token không hợp lệ',
                statusCode: 401,
                timestamp: '2025-09-05T13:30:00.000Z',
                path: '/roles'
            }
        }),
        ApiResponse({
            status: HttpStatus.FORBIDDEN,
            description: `Không có quyền truy cập - Yêu cầu role: ${roles.join(', ')} (SUPER_ADMIN tự động có quyền)`,
            type: ErrorResponseDto,
            example: {
                success: false,
                message: `Không có quyền truy cập - Yêu cầu role: ${roles.join(', ')} (SUPER_ADMIN tự động có quyền)`,
                statusCode: 403,
                timestamp: '2025-09-05T13:30:00.000Z',
                path: '/roles'
            }
        })
    );
}

/**
 * Chỉ cho phép ADMIN truy cập (SUPER_ADMIN tự động có quyền)
 */
export function AdminOnly() {
    return RequireAuth(ROLE_NAMES.ADMIN);
}

/**
 * Cho phép các role quản trị truy cập
 */
export function AdminRoles() {
    return RequireAuth(...ADMIN_ROLES);
}

/**
 * Cho phép các role có thể tạo nội dung truy cập
 */
export function ContentCreatorRoles() {
    return RequireAuth(...CONTENT_CREATOR_ROLES);
}

/**
 * Chỉ cho phép TEACHER truy cập (SUPER_ADMIN tự động có quyền)
 */
export function TeacherOnly() {
    return RequireAuth(ROLE_NAMES.TEACHER);
}

/**
 * Chỉ cho phép STUDENT truy cập (SUPER_ADMIN tự động có quyền)
 */
export function StudentOnly() {
    return RequireAuth(ROLE_NAMES.STUDENT);
}

/**
 * Cho phép TEACHER hoặc STUDENT truy cập (SUPER_ADMIN tự động có quyền)
 */
export function TeacherOrStudent() {
    return RequireAuth(ROLE_NAMES.TEACHER, ROLE_NAMES.STUDENT);
}

/**
 * Cho phép ADMIN hoặc TEACHER truy cập (SUPER_ADMIN tự động có quyền)
 */
export function AdminOrTeacher() {
    return RequireAuth(ROLE_NAMES.ADMIN, ROLE_NAMES.TEACHER);
}

/**
 * Cho phép tất cả các role truy cập (SUPER_ADMIN tự động có quyền)
 */
export function AllRoles() {
    return RequireAuth(ROLE_NAMES.ADMIN, ROLE_NAMES.TEACHER, ROLE_NAMES.STUDENT);
}

/**
 * Custom decorator cho bất kỳ combination nào
 */
export function AnyOf(...roles: string[]) {
    return RequireAuth(...roles);
}

/**
 * Chỉ yêu cầu authentication, không có role requirement
 */
export function AuthOnly() {
    return applyDecorators(
        UseGuards(AuthGuard),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            status: 401,
            description: 'Không có token hoặc token không hợp lệ',
            type: ErrorResponseDto
        })
    );
}
