// src/presentation/controllers/course-enrollment.controller.ts
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
  StreamableFile,
  Res,
  Injectable,
} from '@nestjs/common'
import { CourseEnrollmentListQueryDto } from '../../application/dtos/course-enrollment/course-enrollment-list-query.dto'
import { ExportCourseEnrollmentListOptionDto } from '../../application/dtos/course-enrollment/export-course-enrollment-list-option.dto'
import { CreateCourseEnrollmentDto } from '../../application/dtos/course-enrollment/create-course-enrollment.dto'
import { UpdateCourseEnrollmentDto } from '../../application/dtos/course-enrollment/update-course-enrollment.dto'
import {
  CourseEnrollmentListResponseDto,
  CourseEnrollmentResponseDto,
} from '../../application/dtos/course-enrollment/course-enrollment.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
  GetAllCourseEnrollmentUseCase,
  GetStudentCourseEnrollmentsUseCase,
  GetCourseEnrollmentByIdUseCase,
  CreateCourseEnrollmentUseCase,
  UpdateCourseEnrollmentUseCase,
  DeleteCourseEnrollmentUseCase,
  ExportCourseEnrollmentListUseCase,
} from '../../application/use-cases/course-enrollment'

import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import type { Response } from 'express'

@Injectable()
@Controller('course-enrollments')
export class CourseEnrollmentController {
  constructor(
    private readonly getAllCourseEnrollmentUseCase: GetAllCourseEnrollmentUseCase,
    private readonly getStudentCourseEnrollmentsUseCase: GetStudentCourseEnrollmentsUseCase,
    private readonly getCourseEnrollmentByIdUseCase: GetCourseEnrollmentByIdUseCase,
    private readonly createCourseEnrollmentUseCase: CreateCourseEnrollmentUseCase,
    private readonly updateCourseEnrollmentUseCase: UpdateCourseEnrollmentUseCase,
    private readonly deleteCourseEnrollmentUseCase: DeleteCourseEnrollmentUseCase,
    private readonly exportCourseEnrollmentListUseCase: ExportCourseEnrollmentListUseCase,
  ) { }

  @Get()
  @RequirePermission(PERMISSION_CODES.COURSE_ENROLLMENT.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query() query: CourseEnrollmentListQueryDto,
    @CurrentUser('studentId') studentId: number,
  ): Promise<CourseEnrollmentListResponseDto> {
    return ExceptionHandler.execute(() => {
      if (!query.studentId) {
        query.studentId = studentId
      }
      return this.getAllCourseEnrollmentUseCase.execute(query)
    })
  }

  /**
   * Endpoint: GET /api/course-enrollments/student/my
   *
   * Header:
   * - Authorization: Bearer <JWT của học sinh>
   *
   * Query thường dùng:
   * - page?: number, mặc định 1.
   * - limit?: number, mặc định 10.
   * - search?: string, tìm theo tên khóa học hoặc thông tin học sinh.
   * - grade?: number, lọc khối từ 1 đến 12.
   * - subjectId?: number, lọc theo ID môn học.
   * - status?: ACTIVE | COMPLETED | CANCELLED | BLOCKED_UNPAID | TRIAL.
   * - sortBy?: enrollmentId | courseId | studentId | enrolledAt | status.
   * - sortOrder?: asc | desc.
   *
   * Ví dụ:
   * GET /api/course-enrollments/student/my?search=toán&grade=12&subjectId=1&page=1&limit=10
   *
   * Backend luôn lấy studentId từ JWT và loại các course DRAFT.
   * Response gồm course, completionPercentage, thumbnail, teacherName và teacherAvatarUrl.
   */
  @Get('student/my')
  // @RequirePermission(PERMISSION_CODES.COURSE_ENROLLMENT.GET_MY_ENROLLMENTS)
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getMyEnrollments(
    @CurrentUser() user: any,
    @Query() query: CourseEnrollmentListQueryDto,
  ): Promise<CourseEnrollmentListResponseDto> {
    return ExceptionHandler.execute(() => {
      return this.getStudentCourseEnrollmentsUseCase.execute(user.studentId, query)
    })
  }

  /**
   * Endpoint: GET /api/course-enrollments/student/my/by-progress
   *
   * Header:
   * - Authorization: Bearer <JWT của học sinh>
   *
   * Query:
   * - page?: number, mặc định 1.
   * - limit?: number, mặc định 10.
   * - search?: string, tìm theo tên khóa học hoặc thông tin học sinh.
   * - grade?: number, lọc khối từ 1 đến 12.
   * - subjectId?: number, lọc theo ID môn học.
   * - status?: ACTIVE | COMPLETED | CANCELLED | BLOCKED_UNPAID | TRIAL.
   * - sortOrder?: asc | desc, mặc định desc.
   *   - desc: tiến độ cao đến thấp.
   *   - asc: tiến độ thấp đến cao.
   * - sortBy không được sử dụng vì endpoint luôn sắp xếp theo completionPercentage.
   *
   * Ví dụ:
   * GET /api/course-enrollments/student/my/by-progress?grade=12&subjectId=1&sortOrder=desc&page=1&limit=10
   *
   * Response giống GET /api/course-enrollments/student/my, gồm course,
   * completionPercentage, thumbnail, teacherName và teacherAvatarUrl.
   * Backend lọc toàn bộ kết quả trước, tính tiến độ, sắp xếp rồi mới phân trang.
   */
  @Get('student/my/by-progress')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getMyEnrollmentsSortedByProgress(
    @CurrentUser() user: any,
    @Query() query: CourseEnrollmentListQueryDto,
  ): Promise<CourseEnrollmentListResponseDto> {
    return ExceptionHandler.execute(() => {
      return this.getStudentCourseEnrollmentsUseCase.executeSortedByProgress(
        user.studentId,
        query,
      )
    })
  }

  /**
   * Export danh sách đăng ký khóa học ra file Excel.
   *
   * Endpoint:
   * - Method: GET
   * - Full path: /api/course-enrollments/export/excel
   * - Controller path: /course-enrollments/export/excel
   *
   * Permission:
   * - COURSE_ENROLLMENT.EXPORT_EXCEL
   *
   * Input:
   * - Query params: ExportCourseEnrollmentListOptionDto
   * - Filter/pagination params kế thừa từ CourseEnrollmentListQueryDto:
   *   - page: number (optional, default: 1)
   *   - limit: number (optional, DTO default: 10; export use case override thành 10000 bản ghi)
   *   - search: string (optional)
   *   - sortBy: enrollmentId | courseId | studentId | enrolledAt | status (optional, default: enrolledAt)
   *   - sortOrder: asc | desc (optional, default: desc)
   *   - courseId: number (optional)
   *   - studentId: number (optional)
   *   - status: ACTIVE | COMPLETED | CANCELLED | BLOCKED_UNPAID | TRIAL (optional)
   *   - enrolledAtFrom: string YYYY-MM-DD (optional)
   *   - enrolledAtTo: string YYYY-MM-DD (optional)
   *   - courseVisibility: DRAFT | PRIVATE | PUBLISHED (optional)
   * - Export column options:
   *   - includeSchool: boolean (optional, default: true)
   *   - includeGender: boolean (optional, default: true)
   *   - includeDateOfBirth: boolean (optional, default: true)
   *   - includeUsername: boolean (optional, default: true)
   *   - includeParentPhone: boolean (optional, default: true)
   *   - includeStudentPhone: boolean (optional, default: false)
   *   - includeGrade: boolean (optional, default: true)
   *   - includeHighSchoolGraduationYear: boolean (optional, default: true)
   *   - includeEmail: boolean (optional, default: true)
   *   - includeIsActive: boolean (optional, default: true; hiện cột Trạng thái luôn được export)
   *   - includeCreatedAt: boolean (optional, default: true)
   *
   * Output:
   * - HTTP 200 OK
   * - Response body: StreamableFile chứa buffer file .xlsx
   * - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   * - Content-Disposition: attachment; filename="<encoded filename>"
   * - File name format: Danh_sach_hoc_sinh_dang_ky_khoa_hoc_<dd_MM_yyyy_HH_mm>.xlsx
   * - Các cột luôn có: STT, Mã học sinh, Họ và tên, Trạng thái
   * - Các cột tùy chọn phụ thuộc các flag include... ở trên.
   *
   * Error:
   * - 404 Not Found nếu không có dữ liệu đăng ký khóa học để export.
   *
   * @example
   * GET /api/course-enrollments/export/excel?courseId=1&status=ACTIVE&includeStudentPhone=true
   */
  @Get('export/excel')
  @RequirePermission(PERMISSION_CODES.COURSE_ENROLLMENT.EXPORT_EXCEL)
  @HttpCode(HttpStatus.OK)
  async exportCourseEnrollmentList(
    @Query() options: ExportCourseEnrollmentListOptionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return ExceptionHandler.execute(async () => {
      const { buffer, filename } = await this.exportCourseEnrollmentListUseCase.execute(options)

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      })

      return new StreamableFile(buffer)
    })
  }

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.COURSE_ENROLLMENT.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('studentId') studentId?: number,
  ): Promise<BaseResponseDto<CourseEnrollmentResponseDto>> {
    return ExceptionHandler.execute(() => this.getCourseEnrollmentByIdUseCase.execute(id, studentId))
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.COURSE_ENROLLMENT.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateCourseEnrollmentDto,
    @CurrentUser() user: any,
  ): Promise<BaseResponseDto<CourseEnrollmentResponseDto>> {
    return ExceptionHandler.execute(() => {
      const isStudent = !!user.studentId
      const adminId = user.adminId
      return this.createCourseEnrollmentUseCase.execute(dto, isStudent, adminId)
    })
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.COURSE_ENROLLMENT.UPDATE)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseEnrollmentDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<CourseEnrollmentResponseDto>> {
    return ExceptionHandler.execute(() => this.updateCourseEnrollmentUseCase.execute(id, dto, adminId))
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.COURSE_ENROLLMENT.DELETE)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<null>> {
    return ExceptionHandler.execute(() => this.deleteCourseEnrollmentUseCase.execute(id, adminId))
  }
}
