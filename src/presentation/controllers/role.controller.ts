import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CreateRoleDto, RoleResponseDto } from '../../application/dtos/role/role.dto';
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util';
import { ErrorResponseDto } from 'src/application/dtos/common/error-response.dto';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';
import { CreateRoleUseCase } from '../../application/use-cases/role/create-role.use-case';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../infrastructure/services/auth.service';
import { AdminOnly } from '../../shared/decorators/permission.decorator';

@ApiTags('Roles')
@Controller('roles')
export class RoleController {
    constructor(
        private readonly createRoleUseCase: CreateRoleUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @AdminOnly() // Sử dụng decorator mới - chỉ ADMIN, SUPER_ADMIN tự động có quyền
    @ApiOperation({ summary: 'Tạo role mới - Yêu cầu quyền ADMIN (SUPER_ADMIN tự động có quyền)' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Role được tạo thành công',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Role được tạo thành công' },
                statusCode: { type: 'number', example: 201 },
                timestamp: { type: 'string', example: '2025-09-05T13:30:00.000Z' },
                path: { type: 'string', example: '/roles' },
                data: {
                    type: 'object',
                    properties: {
                        roleId: { type: 'number', example: 1 },
                        roleName: { type: 'string', example: 'TEACHER' },
                        description: { type: 'string', example: 'Quyền giảng viên' },
                        isAssignable: { type: 'boolean', example: true },
                        requiredByRoleId: { type: 'number', nullable: true, example: null },
                        createdAt: { type: 'string', example: '2025-09-05T13:30:00.000Z' }
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Dữ liệu không hợp lệ',
        type: ErrorResponseDto,
        example: {
            success: false,
            message: 'Dữ liệu không hợp lệ',
            statusCode: HttpStatus.BAD_REQUEST,
            timestamp: '2025-09-05T13:30:00.000Z',
            path: '/roles',
            errors: ['roleName không được để trống']
        }
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Không có quyền truy cập',
        type: ErrorResponseDto,
        example: {
            success: false,
            message: 'Không có quyền truy cập - Yêu cầu role: ADMIN (SUPER_ADMIN tự động có quyền)',
            statusCode: HttpStatus.FORBIDDEN,
            timestamp: '2025-09-05T13:30:00.000Z',
            path: '/roles'
        }
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Role đã tồn tại',
        type: ErrorResponseDto,
        example: {
            success: false,
            message: 'Role đã tồn tại',
            statusCode: HttpStatus.CONFLICT,
            timestamp: '2025-09-05T13:30:00.000Z',
            path: '/roles'
        }
    })
    async createRole(
        @Body() dto: CreateRoleDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<RoleResponseDto>> {
        return ExceptionHandler.execute(() => this.createRoleUseCase.execute(dto, adminId));
    }
}