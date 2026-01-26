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
  Res,
  Header,
  StreamableFile,
} from '@nestjs/common'
import type { Response } from 'express'
import { AttendanceListQueryDto } from '../../application/dtos/attendance/attendance-list-query.dto'
import { CreateAttendanceDto } from '../../application/dtos/attendance/create-attendance.dto'
import { UpdateAttendanceDto } from '../../application/dtos/attendance/update-attendance.dto'
import { CreateBulkAttendanceBySessionDto } from '../../application/dtos/attendance/create-bulk-attendance-by-session.dto'
import { AttendanceListResponseDto, AttendanceResponseDto } from '../../application/dtos/attendance/attendance.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { AttendanceStatisticsDto } from '../../application/dtos/attendance/attendance-statistics.dto'
import { ExportAttendanceOptionsDto } from '../../application/dtos/attendance/export-attendance-options.dto'
import { ExportAttendanceImageOptionsDto } from '../../application/dtos/attendance/export-attendance-image-options.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
  GetAllAttendanceUseCase,
  GetAttendanceByIdUseCase,
  CreateAttendanceUseCase,
  UpdateAttendanceUseCase,
  DeleteAttendanceUseCase,
  CreateBulkAttendanceBySessionUseCase,
  GetAttendanceStatisticsBySessionUseCase,
  ExportAttendanceBySessionUseCase,
  ExportAttendanceImageUseCase,
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
    private readonly getAttendanceStatisticsBySessionUseCase: GetAttendanceStatisticsBySessionUseCase,
    private readonly exportAttendanceBySessionUseCase: ExportAttendanceBySessionUseCase,
    private readonly exportAttendanceImageUseCase: ExportAttendanceImageUseCase,
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
   * - fromDate: filter từ ngày (ISO format: YYYY-MM-DD)
   * - toDate: filter đến ngày (ISO format: YYYY-MM-DD)
   * - sortBy: trường sắp xếp (attendanceId, markedAt, status)
   * - sortOrder: thứ tự sắp xếp (asc, desc)
   */
  @Get()
  @RequirePermission(PERMISSION_CODES.ATTENDANCE_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query() query: AttendanceListQueryDto,
  ): Promise<AttendanceListResponseDto> {
    return ExceptionHandler.execute(() => {
      return this.getAllAttendanceUseCase.execute(query)
    })
  }

  @Get('session/:sessionId')
  @RequirePermission(PERMISSION_CODES.ATTENDANCE_GET_ALL_BY_SESSION)
  @HttpCode(HttpStatus.OK)
  async getAllBySession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Query() query: AttendanceListQueryDto,
  ): Promise<AttendanceListResponseDto> {
    query.sessionId = sessionId
    return ExceptionHandler.execute(() => this.getAllAttendanceUseCase.execute(query))
  }

  @Get('student/my')
  @RequirePermission(PERMISSION_CODES.ATTENDANCE_GET_MY_ATTENDANCES)
  @HttpCode(HttpStatus.OK)
  async getMyAttendances(
    @CurrentUser('studentId') studentId: number,
    @Query() query: AttendanceListQueryDto,
  ): Promise<AttendanceListResponseDto> {
    return ExceptionHandler.execute(() => {
      query.studentId = studentId
      return this.getAllAttendanceUseCase.execute(query)
    })
  }

  /**
   * Get attendance by ID
   * GET /attendances/:id
   */
  @Get(':id')
  @RequirePermission(PERMISSION_CODES.ATTENDANCE_GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('studentId') studentId?: number,
  ): Promise<BaseResponseDto<AttendanceResponseDto>> {
    return ExceptionHandler.execute(() => this.getAttendanceByIdUseCase.execute(id, studentId))
  }

  /**
   * Create new attendance
   * POST /attendances
   */
  @Post()
  @RequirePermission(PERMISSION_CODES.ATTENDANCE_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateAttendanceDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<AttendanceResponseDto>> {
    return ExceptionHandler.execute(() => this.createAttendanceUseCase.execute(dto, adminId))
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
  @RequirePermission(PERMISSION_CODES.ATTENDANCE_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createBulkBySession(
    @Body() dto: CreateBulkAttendanceBySessionDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<AttendanceResponseDto[]>> {
    return ExceptionHandler.execute(() => this.createBulkAttendanceBySessionUseCase.execute(dto, adminId, adminId))
  }

  /**
   * Update attendance
   * PUT /attendances/:id
   */
  @Put(':id')
  @RequirePermission(PERMISSION_CODES.ATTENDANCE_UPDATE)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<AttendanceResponseDto>> {
    return ExceptionHandler.execute(() => this.updateAttendanceUseCase.execute(id, dto, adminId))
  }

  /**
   * Delete attendance
   * DELETE /attendances/:id
   */
  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.ATTENDANCE_DELETE)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<{ deleted: boolean }>> {
    return ExceptionHandler.execute(() => this.deleteAttendanceUseCase.execute(id, adminId))
  }

  /**
   * Get attendance statistics by session
   * GET /attendances/statistics/session/:sessionId
   * Response:
   * - total: Tổng số điểm danh
   * - present: Số lượng có mặt
   * - absent: Số lượng vắng
   * - late: Số lượng muộn
   * - makeup: Số lượng học bù
   */
  @Get('statistics/session/:sessionId')
  @RequirePermission(PERMISSION_CODES.ATTENDANCE_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getStatisticsBySession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ): Promise<BaseResponseDto<AttendanceStatisticsDto>> {
    return ExceptionHandler.execute(() => this.getAttendanceStatisticsBySessionUseCase.execute(sessionId))
  }

  /**
   * Export attendance to Excel by session
   * GET /attendances/export/session/:sessionId
   * Query params (optional):
   * - includeSchool: boolean (default: true)
   * - includeParentPhone: boolean (default: true)
   * - includeStudentPhone: boolean (default: false)
   * - includeGrade: boolean (default: true)
   * - includeEmail: boolean (default: true)
   * - includeMarkedAt: boolean (default: true)
   * - includeNotes: boolean (default: true)
   * - includeMakeupNote: boolean (default: false)
   * - includeMarkerName: boolean (default: true)
   * Download Excel file with attendance list
   */
  @Get('export/session/:sessionId')
  @RequirePermission(PERMISSION_CODES.ATTENDANCE_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async exportBySession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Query() options: ExportAttendanceOptionsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return ExceptionHandler.execute(async () => {
      const { buffer, filename } = await this.exportAttendanceBySessionUseCase.execute(sessionId, options)

      // Set response headers for file download
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      })

      return new StreamableFile(buffer)
    })
  }

  /**
   * Export attendance image by ID
   * GET /attendances/export/image/:id
   * Query params (optional):
   * - mode: 'download' | 'view' (default: 'download')
   * - format: 'png' | 'jpeg' | 'webp' (default: 'png')
   * - quality: number (0-100, default: 90, for jpeg/webp)
   * - width: number (default: 1200)
   * - includePhoto: boolean (default: true)
   * - includeParentPhone: boolean (default: true)
   * - includeStudentPhone: boolean (default: false)
   * - includeEmail: boolean (default: true)
   * - includeNotes: boolean (default: true)
   * - includeQRCode: boolean (default: false)
   * - includeMarkerName: boolean (default: true)
   *
   * Mode:
   * - download: Tải về file (Content-Disposition: attachment)
   * - view: Xem trực tiếp trong browser (Content-Disposition: inline)
   */
  @Get('export/image/:id')
  @RequirePermission(PERMISSION_CODES.ATTENDANCE_GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async exportImage(
    @Param('id', ParseIntPipe) id: number,
    @Query() options: ExportAttendanceImageOptionsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return ExceptionHandler.execute(async () => {
      const { buffer, filename } = await this.exportAttendanceImageUseCase.execute(id, options)

      // Set response headers based on format
      const contentTypes = {
        png: 'image/png',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
      }

      // Set Content-Disposition based on mode
      const disposition =
        options.mode === 'view'
          ? `inline; filename="${encodeURIComponent(filename)}"`
          : `attachment; filename="${encodeURIComponent(filename)}"`

      res.set({
        'Content-Type': contentTypes[options.format || 'png'],
        'Content-Disposition': disposition,
        'Cache-Control': 'no-cache',
      })

      return new StreamableFile(buffer)
    })
  }
}
