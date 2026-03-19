import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
} from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from 'src/shared/constants/permissions/permission.codes'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'
import { ResetStudentPasswordByDateRangeDto } from 'src/application/dtos/student/reset-student-password-by-date-range.dto'
import { ResetStudentPasswordByDateRangeUseCase } from 'src/application/use-cases/student/reset-student-password-by-date-range.use-case'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { Injectable } from '@nestjs/common'
import { UpdateAdminDirectDto } from 'src/application/dtos/admin/update-admin-direct.dto'
import { AdminResponseDto } from 'src/application/dtos/admin/admin.dto'
import { SuperAdminUpdateAdminDirectUseCase } from 'src/application/use-cases/admin/super-admin-update-admin-direct.use-case'

@Injectable()
@Controller('super-admin')
export class AdminStudentController {
    constructor(
        private readonly resetStudentPasswordByDateRangeUseCase: ResetStudentPasswordByDateRangeUseCase,
        private readonly superAdminUpdateAdminDirectUseCase: SuperAdminUpdateAdminDirectUseCase,
    ) { }

    /**
        * Reset password học sinh theo khoảng thời gian tạo tài khoản.
        * POST /super-admin/reset-password-by-date-range
        *
        * Input (Body: ResetStudentPasswordByDateRangeDto):
        * - fromDate: string (ISO date), ví dụ: 2026-01-01
        * - toDate: string (ISO date), ví dụ: 2026-03-31
        *
        * Xử lý:
        * - Tìm tất cả học sinh có user.createdAt trong khoảng [fromDate, toDate]
        * - Password mới = studentPhone của từng học sinh
        * - Password được hash trước khi cập nhật vào user.passwordHash
        *
        * Output (BaseResponseDto):
        * - success: boolean
        * - message: string
        * - data:
        *   - fromDate: string
        *   - toDate: string
        *   - totalStudents: number
        *   - updatedCount: number
        *   - skippedCount: number
        *   - results: Array<{ studentId, userId, studentPhone?, status, reason? }>
     */
    @Post('reset-password-by-date-range')
    @RequirePermission(PERMISSION_CODES.STUDENT.UPDATE)
    @HttpCode(HttpStatus.OK)
    async resetPasswordByDateRange(
        @Body() dto: ResetStudentPasswordByDateRangeDto,
        @CurrentUser('adminId') _adminId?: number,
    ): Promise<BaseResponseDto<any>> {
        return ExceptionHandler.execute(() =>
            this.resetStudentPasswordByDateRangeUseCase.execute(dto),
        )
    }

    /**
        * Cập nhật trực tiếp thông tin Admin và User của Admin.
        * POST /super-admin/update-admin-direct
        *
        * Input (Body: UpdateAdminDirectDto):
        * - adminId: number (required)
        * - username?: string
        * - email?: string
        * - firstName?: string
        * - lastName?: string
        * - gender?: Gender
        * - dateOfBirth?: Date
        * - isEmailVerified?: boolean
        * - isActive?: boolean
        * - password?: string (sẽ được hash)
        * - subjectId?: number
        *
        * Output (BaseResponseDto<AdminResponseDto>):
        * - success: boolean
        * - message: string
        * - data: AdminResponseDto
     */
    @Post('update-admin-direct')
    @RequirePermission(PERMISSION_CODES.ADMIN.CREATE)
    @HttpCode(HttpStatus.OK)
    async updateAdminDirect(
        @Body() dto: UpdateAdminDirectDto,
        @CurrentUser('adminId') _adminId?: number,
    ): Promise<BaseResponseDto<AdminResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.superAdminUpdateAdminDirectUseCase.execute(dto),
        )
    }
}
