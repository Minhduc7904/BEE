// src/presentation/controllers/attendance.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Query,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from '@nestjs/common'
import { AttendanceListQueryDto } from '../../application/dtos/attendance/attendance-list-query.dto'
import { CreateAttendanceDto } from '../../application/dtos/attendance/create-attendance.dto'
import { UpdateAttendanceDto } from '../../application/dtos/attendance/update-attendance.dto'
import { CreateBulkAttendanceBySessionDto } from '../../application/dtos/attendance/create-bulk-attendance-by-session.dto'
import {
    AttendanceListResponseDto,
    AttendanceResponseDto,
} from '../../application/dtos/attendance/attendance.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import {
    GetAllAttendanceUseCase,
    GetAttendanceByIdUseCase,
    CreateAttendanceUseCase,
    UpdateAttendanceUseCase,
    DeleteAttendanceUseCase,
    CreateBulkAttendanceBySessionUseCase,
} from '../../application/use-cases/attendance'
import { Injectable } from '@nestjs/common'

@Injectable()
@Controller('attendances')
export class AttendanceController {
    constructor(
        private readonly getAllAttendanceUseCase: GetAllAttendanceUseCase,
        private readonly getAttendanceByIdUseCase: GetAttendanceByIdUseCase,
        private readonly createAttendanceUseCase: CreateAttendanceUseCase,
        private readonly updateAttendanceUseCase: UpdateAttendanceUseCase,
        private readonly deleteAttendanceUseCase: DeleteAttendanceUseCase,
        private readonly createBulkAttendanceBySessionUseCase: CreateBulkAttendanceBySessionUseCase,
    ) { }

    /**
     * Get all attendances with pagination and filters
     * GET /attendances
     * Query params:
     * - page: số trang (mặc định: 1)
     * - limit: số lượng mỗi trang (mặc định: 10)
     * - search: tìm kiếm theo tên học sinh, ghi chú
     * - sessionId: filter theo buổi học
     * - studentId: filter theo học sinh
     * - classId: filter theo lớp học
     * - status: filter theo trạng thái (PRESENT, ABSENT, LATE, MAKEUP)
     * - sortBy: trường sắp xếp (attendanceId, markedAt, status)
     * - sortOrder: thứ tự sắp xếp (asc, desc)
     */
    @Get()
    @RequirePermission('attendance.getAll')
    @HttpCode(HttpStatus.OK)
    async getAll(
        @Query() query: AttendanceListQueryDto,
    ): Promise<AttendanceListResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getAllAttendanceUseCase.execute(query),
        )
    }

    /**
     * Get attendance by ID
     * GET /attendances/:id
     */
    @Get(':id')
    @RequirePermission('attendance.getById')
    @HttpCode(HttpStatus.OK)
    async getById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<AttendanceResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getAttendanceByIdUseCase.execute(id),
        )
    }

    /**
     * Create new attendance
     * POST /attendances
     */
    @Post()
    @RequirePermission('attendance.create')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateAttendanceDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<AttendanceResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.createAttendanceUseCase.execute(dto, adminId),
        )
    }

    /**
     * Create bulk attendances for all students in a session
     * POST /attendances/bulk/session
     * Body:
     * - sessionId: ID của buổi học
     * - status: trạng thái mặc định (optional, default: PRESENT)
     * - notes: ghi chú (optional)
     * 
     * API này sẽ tự động tạo attendance cho tất cả học sinh trong lớp của buổi học
     * Bỏ qua những học sinh đã có attendance rồi
     */
    @Post('bulk/session')
    @RequirePermission('attendance.create')
    @HttpCode(HttpStatus.CREATED)
    async createBulkBySession(
        @Body() dto: CreateBulkAttendanceBySessionDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<AttendanceResponseDto[]>> {
        return ExceptionHandler.execute(() =>
            this.createBulkAttendanceBySessionUseCase.execute(dto, adminId),
        )
    }

    /**
     * Update attendance
     * PUT /attendances/:id
     */
    @Put(':id')
    @RequirePermission('attendance.update')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateAttendanceDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<AttendanceResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.updateAttendanceUseCase.execute(id, dto, adminId),
        )
    }

    /**
     * Delete attendance
     * DELETE /attendances/:id
     */
    @Delete(':id')
    @RequirePermission('attendance.delete')
    @HttpCode(HttpStatus.OK)
    async delete(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<{ deleted: boolean }>> {
        return ExceptionHandler.execute(() =>
            this.deleteAttendanceUseCase.execute(id),
        )
    }
}
