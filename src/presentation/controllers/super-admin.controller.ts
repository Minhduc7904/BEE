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

@Injectable()
@Controller('super-admin')
export class AdminStudentController {
    constructor(
        private readonly resetStudentPasswordByDateRangeUseCase: ResetStudentPasswordByDateRangeUseCase,
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
}
