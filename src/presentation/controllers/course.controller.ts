// src/presentation/controllers/course.controller.ts
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
  StreamableFile,
  UseInterceptors,
} from '@nestjs/common'
import type { Response } from 'express'
import { CourseListQueryDto } from '../../application/dtos/course/course-list-query.dto'
import { CreateCourseDto } from '../../application/dtos/course/create-course.dto'
import { UpdateCourseBasicInfoDto, UpdateCoursePricingDto } from '../../application/dtos/course/update-course.dto'
import {
  CourseListResponseDto,
  CourseResponseDto,
} from '../../application/dtos/course/course.dto'
import {
  CourseMediaResponseDto,
  UpdateCourseMediaDto,
} from '../../application/dtos/course/course-media.dto'
import {
  PublicSeoCourseDetailDto,
  PublicSeoCourseListResponseDto,
} from '../../application/dtos/course/public-seo-course.dto'
import { StudentCourseDetailResponseDto } from '../../application/dtos/course/student-course-detail.dto'
import {
  CourseSearchQueryDto,
} from '../../application/dtos/course/course-search-query.dto'
import { CourseStudentsAttendanceQueryDto } from '../../application/dtos/course/course-students-attendance-query.dto'
import { ExportCourseStudentsAttendanceQueryDto } from '../../application/dtos/course/export-course-students-attendance-query.dto'
import { CourseStudentsAttendanceListResponseDto } from '../../application/dtos/course/course-student-attendance.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
  GetAllCourseUseCase,
  GetCourseByIdUseCase,
  CreateCourseUseCase,
  UpdateCourseUseCase,
  DeleteCourseUseCase,
  GetCourseStudentsAttendanceUseCase,
  ExportCourseStudentsAttendanceUseCase,
  SearchCoursesUseCase,
  GetStudentCourseDetailUseCase,
  GetStudentAvailableOnlineCoursesUseCase,
  GetPublicSeoOnlineCoursesUseCase,
  GetPublicSeoCourseDetailUseCase,
  UpdateCourseMediaUseCase,
} from '../../application/use-cases/course'
import { Injectable } from '@nestjs/common'

@Injectable()
@Controller('courses')
export class CourseController {
  constructor(
    private readonly getAllCourseUseCase: GetAllCourseUseCase,
    private readonly getCourseByIdUseCase: GetCourseByIdUseCase,
    private readonly createCourseUseCase: CreateCourseUseCase,
    private readonly updateCourseUseCase: UpdateCourseUseCase,
    private readonly deleteCourseUseCase: DeleteCourseUseCase,
    private readonly getCourseStudentsAttendanceUseCase: GetCourseStudentsAttendanceUseCase,
    private readonly exportCourseStudentsAttendanceUseCase: ExportCourseStudentsAttendanceUseCase,
    private readonly searchCoursesUseCase: SearchCoursesUseCase,
    private readonly getStudentCourseDetailUseCase: GetStudentCourseDetailUseCase,
    private readonly getStudentAvailableOnlineCoursesUseCase: GetStudentAvailableOnlineCoursesUseCase,
    private readonly getPublicSeoOnlineCoursesUseCase: GetPublicSeoOnlineCoursesUseCase,
    private readonly getPublicSeoCourseDetailUseCase: GetPublicSeoCourseDetailUseCase,
    private readonly updateCourseMediaUseCase: UpdateCourseMediaUseCase,
  ) { }

  @Get()
  @RequirePermission(PERMISSION_CODES.COURSE.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllCourses(@Query() query: CourseListQueryDto): Promise<CourseListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllCourseUseCase.execute(query))
  }

  @Get('search')
  @RequirePermission(PERMISSION_CODES.COURSE.SEARCH)
  @HttpCode(HttpStatus.OK)
  async searchCourses(
    @Query() query: CourseSearchQueryDto,
    @CurrentUser() user?: any,
  ): Promise<CourseListResponseDto> {
    // All permission logic is handled in the UseCase
    const context = {
      user: {
        adminId: user?.adminId,
        studentId: user?.studentId,
        permissions: user?.permissions ?? [],
      },
    }
    
    return ExceptionHandler.execute(() =>
      this.searchCoursesUseCase.execute(query, context),
    )
  }

  @Get('admin/my')
  @RequirePermission(PERMISSION_CODES.COURSE.GET_MY_COURSES)
  @HttpCode(HttpStatus.OK)
  async getMyCourses(
    @Query() query: CourseListQueryDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<CourseListResponseDto> {
    query.teacherId = adminId
    return ExceptionHandler.execute(() => this.getAllCourseUseCase.execute(query))
  }

  /**
   * Endpoint: GET /api/courses/student/online-not-enrolled
   *
   * Request:
   * - Header: Authorization: Bearer <JWT>
   * - Query: CourseListQueryDto
   *   page, limit, search, grade, subjectId, teacherId, academicYear, sortBy, sortOrder
   *
   * Response:
   * - Danh sach khoa hoc PUBLISHED, chua ket thuc, co courseType ONLINE hoac ALL,
   *   va hoc sinh hien tai chua co enrollment ACTIVE.
   */
  @Get('student/online-not-enrolled')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getStudentOnlineNotEnrolledCourses(
    @Query() query: CourseListQueryDto,
    @CurrentUser('studentId') studentId: number,
  ): Promise<CourseListResponseDto> {
    return ExceptionHandler.execute(() =>
      this.getStudentAvailableOnlineCoursesUseCase.execute(query, studentId),
    )
  }

  /**
   * API lấy danh sách khóa học public online cho trang SEO.
   *
   * Rule:
   * - Không yêu cầu đăng nhập.
   * - Chỉ lấy khóa học có visibility = PUBLISHED.
   * - Chỉ lấy khóa học chưa kết thúc: isEnded = false.
   * - Chỉ lấy khóa học có courseType = ONLINE hoặc ALL.
   * - Hỗ trợ lọc theo page, limit, search, grade, subjectId, teacherId, academicYear.
   * - Hỗ trợ sắp xếp theo courseId, code, title, grade, priceVND, createdAt, updatedAt.
   *
   * Input:
   * - Query page?: number.
   * - Query limit?: number.
   * - Query search?: string.
   * - Query grade?: number.
   * - Query subjectId?: number.
   * - Query teacherId?: number.
   * - Query academicYear?: string.
   * - Query sortBy?: string.
   * - Query sortOrder?: asc | desc.
   *
   * Output:
   * - Danh sách khóa học public online kèm subject, teacher, số buổi học public,
   *   số buổi học thử và số lượt ghi danh.
   */
  @Get('public/seo')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoOnlineCourses(
    @Query() query: CourseListQueryDto,
  ): Promise<PublicSeoCourseListResponseDto> {
    return ExceptionHandler.execute(() => this.getPublicSeoOnlineCoursesUseCase.execute(query))
  }

  /**
   * API lấy chi tiết khóa học public online cho trang SEO.
   *
   * Rule:
   * - Không yêu cầu đăng nhập.
   * - Tham số courseIdOrCode nhận courseId dạng số hoặc code khóa học.
   * - Chỉ trả khóa học có visibility = PUBLISHED, isEnded = false,
   *   và courseType = ONLINE hoặc ALL.
   * - Chỉ trả các buổi học có visibility = PUBLISHED.
   * - Luôn trả danh sách buổi học public trong khóa học.
   * - Nếu buổi học có allowTrial = true thì trả learning item của buổi học đó, trừ HOMEWORK.
   * - Nếu buổi học có allowTrial = false thì learningItems = [] để không lộ nội dung học thử.
   * - Với DOCUMENT, trả media READY giống GET /document-contents trong documentContents[].mediaFiles[].
   * - Với VIDEO_CONTENT, chỉ trả media đã READY và media usage PUBLIC.
   *
   * Input:
   * - Path courseIdOrCode: number | string.
   *
   * Output:
   * - Thông tin khóa học public online, subject, teacher, lớp, trợ giảng,
   *   buổi học public, chương của buổi học và learning item của các buổi học thử.
   */
  @Get('public/seo/:courseIdOrCode')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoCourseDetail(
    @Param('courseIdOrCode') courseIdOrCode: string,
  ): Promise<BaseResponseDto<PublicSeoCourseDetailDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoCourseDetailUseCase.execute(courseIdOrCode))
  }

  /**
   * Get course detail for student
   * GET /courses/student/:id
   * 
   * Kiểm tra:
   * - Course có tồn tại không
   * - Course có phải DRAFT không (nếu DRAFT thì throw error)
   * - Student đã enroll chưa (nếu chưa thì throw error)
   * 
   * Trả về thông tin:
   * - Thông tin cơ bản của course
   * - Thông tin giáo viên (tên, email)
   * - Thông tin enrollment của student
   */
  @Get('student/:id')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getStudentCourseDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('studentId') studentId: number,
  ): Promise<BaseResponseDto<StudentCourseDetailResponseDto>> {
    return ExceptionHandler.execute(() => 
      this.getStudentCourseDetailUseCase.execute(id, studentId)
    )
  }

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.COURSE.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getCourseById(@Param('id', ParseIntPipe) id: number): Promise<BaseResponseDto<CourseResponseDto>> {
    return ExceptionHandler.execute(() => this.getCourseByIdUseCase.execute(id))
  }

  /**
   * API cập nhật media cho khóa học.
   *
   * Rule:
   * - Yêu cầu quyền cập nhật khóa học.
   * - thumbnailMediaId, bannerMediaId và galleryMediaIds phải là media loại IMAGE.
   * - introVideoMediaId phải là media loại VIDEO.
   * - Tất cả media truyền vào phải có status = READY.
   * - Các field đơn thumbnail, banner, introVideo sẽ thay thế media cũ của field đó.
   * - galleryMediaIds sẽ thay thế toàn bộ gallery hiện tại; truyền [] để xóa gallery.
   * - Mặc định visibility = PUBLIC nếu không truyền.
   *
   * Input:
   * - Path id: courseId.
   * - Body thumbnailMediaId?: number.
   * - Body bannerMediaId?: number.
   * - Body introVideoMediaId?: number.
   * - Body galleryMediaIds?: number[].
   * - Body visibility?: PUBLIC | PRIVATE | PROTECTED.
   *
   * Output:
   * - Danh sách media hiện tại của khóa học gồm thumbnail, banner, introVideo, gallery.
   */
  @Put(':id/media')
  @RequirePermission(PERMISSION_CODES.COURSE.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateCourseMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseMediaDto,
    @CurrentUser('userId') userId?: number,
  ): Promise<BaseResponseDto<CourseMediaResponseDto>> {
    return ExceptionHandler.execute(() => this.updateCourseMediaUseCase.execute(id, dto, userId))
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.COURSE.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @Body() dto: CreateCourseDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<CourseResponseDto>> {
    return ExceptionHandler.execute(() => this.createCourseUseCase.execute(dto, adminId))
  }

  @Put(':id/basic-info')
  @RequirePermission(PERMISSION_CODES.COURSE.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateCourseBasicInfo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseBasicInfoDto,
    @CurrentUser('adminId') adminId?: number,
  ) {
    return ExceptionHandler.execute(() => this.updateCourseUseCase.executeBasicInfo(id, dto, adminId))
  }

  @Put(':id/pricing')
  @RequirePermission(PERMISSION_CODES.COURSE.UPDATE_PRICING)
  @HttpCode(HttpStatus.OK)
  async updateCoursePricing(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCoursePricingDto,
    @CurrentUser('adminId') adminId?: number,
  ) {
    return ExceptionHandler.execute(() => this.updateCourseUseCase.executePricing(id, dto, adminId))
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.COURSE.DELETE)
  @HttpCode(HttpStatus.OK)
  async deleteCourse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<null>> {
    return ExceptionHandler.execute(() => this.deleteCourseUseCase.execute(id, adminId))
  }

  /**
   * Get students with attendance records for a course
   *
   * @route GET /courses/:id/students-attendance
   * @param id - Course ID
   * @param query - Query parameters (fromDate, toDate, page, limit, search)
   * @returns Paginated list of students with their attendance records
   *
   * @example
   * GET /courses/1/students-attendance?fromDate=2026-01-01&toDate=2026-01-31&page=1&limit=10
   */
  @Get(':id/students-attendance')
  @RequirePermission(PERMISSION_CODES.COURSE.GET_STUDENTS_ATTENDANCE)
  @HttpCode(HttpStatus.OK)
  async getCourseStudentsAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: CourseStudentsAttendanceQueryDto,
  ): Promise<CourseStudentsAttendanceListResponseDto> {
    return ExceptionHandler.execute(() => this.getCourseStudentsAttendanceUseCase.execute(id, query))
  }

  /**
   * Export course students attendance to Excel
   * GET /courses/:id/students-attendance/export
   * Query params (required):
   * - fromDate: string (ISO format YYYY-MM-DD) - Từ ngày
   * - toDate: string (ISO format YYYY-MM-DD) - Đến ngày
   *
   * Query params (optional):
   * - status: AttendanceStatus - Filter by status (PRESENT, ABSENT, LATE, MAKEUP)
   * - search: string - Tìm kiếm theo tên, email, SĐT học sinh
   * - includeSchool: boolean (default: true)
   * - includeParentPhone: boolean (default: true)
   * - includeStudentPhone: boolean (default: false)
   * - includeGrade: boolean (default: true)
   * - includeEmail: boolean (default: true)
   *
   * Response: Excel file download
   *
   * @example
   * GET /courses/1/students-attendance/export?fromDate=2026-01-01&toDate=2026-01-31&includeSchool=true
   */
  @Get(':id/students-attendance/export')
  @RequirePermission(PERMISSION_CODES.COURSE.GET_STUDENTS_ATTENDANCE)
  @HttpCode(HttpStatus.OK)
  async exportCourseStudentsAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ExportCourseStudentsAttendanceQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return ExceptionHandler.execute(async () => {
      const options = query.toExportOptions()
      const { buffer, filename } = await this.exportCourseStudentsAttendanceUseCase.execute(id, query, options)

      // Set response headers for file download
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      })

      return new StreamableFile(buffer)
    })
  }
}
