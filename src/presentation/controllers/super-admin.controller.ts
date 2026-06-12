import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import axios from 'axios'
import { CurrentUser } from 'src/shared/decorators'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from 'src/shared/constants/permissions/permission.codes'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'
import { ResetStudentPasswordByDateRangeDto } from 'src/application/dtos/student/reset-student-password-by-date-range.dto'
import { UpdateStudentGraduationYearByGradeDto } from 'src/application/dtos/student/update-student-graduation-year-by-grade.dto'
import { PromoteStudentGradeByGraduationYearDto } from 'src/application/dtos/student/promote-student-grade-by-graduation-year.dto'
import { HardDeleteStudentsByGraduationYearGradeExcludedCoursesDto } from 'src/application/dtos/student/hard-delete-students-by-graduation-year-grade-excluded-courses.dto'
import { ResetStudentPasswordByDateRangeUseCase } from 'src/application/use-cases/student/reset-student-password-by-date-range.use-case'
import { UpdateStudentGraduationYearByGradeUseCase } from 'src/application/use-cases/student/update-student-graduation-year-by-grade.use-case'
import { PromoteStudentGradeByGraduationYearUseCase } from 'src/application/use-cases/student/promote-student-grade-by-graduation-year.use-case'
import { HardDeleteStudentsByGraduationYearGradeExcludedCoursesUseCase } from 'src/application/use-cases/student/hard-delete-students-by-graduation-year-grade-excluded-courses.use-case'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { Injectable } from '@nestjs/common'
import { UpdateAdminDirectDto } from 'src/application/dtos/admin/update-admin-direct.dto'
import { AdminResponseDto } from 'src/application/dtos/admin/admin.dto'
import { SuperAdminUpdateAdminDirectUseCase } from 'src/application/use-cases/admin/super-admin-update-admin-direct.use-case'
import { CleanupUnusedMediaOlderThan30DaysUseCase } from 'src/application/use-cases/media/cleanup-unused-media-older-than-30-days.use-case'
import { GenerateMissingExamSlugsUseCase } from 'src/application/use-cases/exam/generate-missing-exam-slugs.use-case'
import { RegenerateQuestionSlugsUseCase } from 'src/application/use-cases/question/regenerate-question-slugs.use-case'
import { SeedDefaultTagsUseCase } from 'src/application/use-cases/tag'
import { SyncPermissionsFromCodesUseCase } from 'src/application/use-cases/permission'

interface ExchangeFacebookTokenDto {
  appId: string
  appSecret: string
  shortLivedToken: string
}

@Injectable()
@Controller('super-admin')
export class AdminStudentController {
  constructor(
    private readonly resetStudentPasswordByDateRangeUseCase: ResetStudentPasswordByDateRangeUseCase,
    private readonly updateStudentGraduationYearByGradeUseCase: UpdateStudentGraduationYearByGradeUseCase,
    private readonly promoteStudentGradeByGraduationYearUseCase: PromoteStudentGradeByGraduationYearUseCase,
    private readonly hardDeleteStudentsByGraduationYearGradeExcludedCoursesUseCase: HardDeleteStudentsByGraduationYearGradeExcludedCoursesUseCase,
    private readonly superAdminUpdateAdminDirectUseCase: SuperAdminUpdateAdminDirectUseCase,
    private readonly cleanupUnusedMediaOlderThan30DaysUseCase: CleanupUnusedMediaOlderThan30DaysUseCase,
    private readonly generateMissingExamSlugsUseCase: GenerateMissingExamSlugsUseCase,
    private readonly regenerateQuestionSlugsUseCase: RegenerateQuestionSlugsUseCase,
    private readonly seedDefaultTagsUseCase: SeedDefaultTagsUseCase,
    private readonly syncPermissionsFromCodesUseCase: SyncPermissionsFromCodesUseCase,
  ) {}

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
    return ExceptionHandler.execute(() => this.resetStudentPasswordByDateRangeUseCase.execute(dto))
  }

  /**
   * Cập nhật năm tốt nghiệp cấp 3 cho học sinh theo khối.
   * POST /super-admin/students/graduation-year/by-grade
   *
   * Input:
   * - grade: number (1-12)
   * - highSchoolGraduationYear: number
   *
   * Chỉ cập nhật các học sinh thuộc khối đã truyền và chưa có năm tốt nghiệp cấp 3.
   */
  @Post('students/graduation-year/by-grade')
  @RequirePermission(PERMISSION_CODES.STUDENT.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateStudentGraduationYearByGrade(
    @Body() dto: UpdateStudentGraduationYearByGradeDto,
    @CurrentUser('adminId') _adminId?: number,
  ): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() => this.updateStudentGraduationYearByGradeUseCase.execute(dto))
  }

  /**
   * Tăng khối cho học sinh theo năm tốt nghiệp cấp 3.
   * POST /super-admin/students/promote-grade/by-graduation-year
   *
   * Input:
   * - highSchoolGraduationYear: number
   *
   * Chỉ tăng khối cho các học sinh có năm tốt nghiệp đã truyền và đang dưới lớp 12.
   */
  @Post('students/promote-grade/by-graduation-year')
  @RequirePermission(PERMISSION_CODES.STUDENT.UPDATE)
  @HttpCode(HttpStatus.OK)
  async promoteStudentGradeByGraduationYear(
    @Body() dto: PromoteStudentGradeByGraduationYearDto,
    @CurrentUser('adminId') _adminId?: number,
  ): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() => this.promoteStudentGradeByGraduationYearUseCase.execute(dto))
  }

  /**
   * Xóa cứng học sinh theo năm tốt nghiệp, khối và danh sách khóa học cần bảo vệ.
   * POST /super-admin/students/hard-delete-by-graduation-year-grade-excluded-courses
   *
   * Rule xử lý:
   * - Đây là API xóa cứng, dữ liệu đã xóa không thể khôi phục bằng soft delete.
   * - `courseIds` là danh sách khóa học cần giữ lại học sinh đang tham gia; bắt buộc truyền mảng không rỗng.
   * - Tất cả `courseIds` truyền vào phải tồn tại, nếu có ID không tồn tại thì API dừng và trả lỗi.
   * - Chỉ chọn học sinh có `highSchoolGraduationYear` và `grade` đúng với input.
   * - Không xóa học sinh có `courseEnrollments.courseId` nằm trong bất kỳ `courseIds` nào đã truyền.
   * - Không xóa học sinh đang nằm trong lớp có `courseClass.courseId` nằm trong bất kỳ `courseIds` nào đã truyền.
   * - Xóa các dữ liệu liên quan trong transaction: câu trả lời bài thi, câu trả lời cuộc thi, bài nộp homework,
   *   trạng thái học learning item, điểm danh, liên kết lớp, đăng ký khóa học, học phí, log điểm, lượt làm bài,
   *   lượt tham gia cuộc thi, bản ghi học sinh và user tương ứng.
   * - Avatar hiện tại được xác định qua `MediaUsage(entityType = USER, entityId = userId, fieldName = avatar)`.
   * - Chỉ hard delete bản ghi media và file avatar trên MinIO nếu media avatar đó không còn được entity khác sử dụng.
   * - Ghi admin audit log với `actionKey = DELETE_STUDENT`, `resourceType = STUDENT`, `resourceId = bulk:{year}:{grade}`.
   * - Audit log thành công lưu input, rule, danh sách học sinh trước khi xóa, thống kê xóa DB và kết quả xóa file avatar.
   * - Audit log thất bại lưu input, danh sách courseIds đã chuẩn hóa và errorMessage.
   * - Nếu xóa file avatar trên MinIO thất bại sau khi DB đã commit, API vẫn trả kết quả và ghi chi tiết vào `avatarFileResults`.
   *
   * Input (Body: HardDeleteStudentsByGraduationYearGradeExcludedCoursesDto):
   * - highSchoolGraduationYear: number - Năm tốt nghiệp cấp 3 của học sinh cần xóa, trong khoảng 1900-2100.
   * - grade: number - Khối lớp của học sinh cần xóa, trong khoảng 1-12.
   * - courseIds: number[] - Danh sách ID khóa học cần bảo vệ học sinh đang tham gia.
   *
   * Output (BaseResponseDto):
   * - success: boolean - Trạng thái xử lý.
   * - message: string - Thông báo kết quả.
   * - data.highSchoolGraduationYear: number - Năm tốt nghiệp cấp 3 đã dùng để lọc.
   * - data.grade: number - Khối lớp đã dùng để lọc.
   * - data.courseIds: number[] - Danh sách khóa học đã dùng để bảo vệ học sinh.
   * - data.totalMatchedByGradeAndGraduationYear: number - Tổng học sinh khớp năm tốt nghiệp và khối trước khi loại trừ khóa học.
   * - data.protectedByCourseCount: number - Số học sinh được giữ lại vì đang tham gia ít nhất một khóa học trong `courseIds`.
   * - data.totalCandidates: number - Số học sinh đủ điều kiện xóa.
   * - data.deletedStudentsCount: number - Số bản ghi học sinh đã xóa.
   * - data.deletedUsersCount: number - Số bản ghi user đã xóa.
   * - data.deletedAvatarMediaCount: number - Số bản ghi media avatar đã hard delete.
   * - data.deletedAvatarFilesCount: number - Số file avatar đã xóa thành công trên MinIO.
   * - data.failedAvatarFilesCount: number - Số file avatar xóa thất bại trên MinIO.
   * - data.skippedSharedAvatarMediaCount: number - Số media avatar không hard delete vì còn được entity khác sử dụng.
   * - data.deleteCounts: Record<string, number> - Thống kê số bản ghi đã xóa theo từng bảng liên quan.
   * - data.deletedStudents: Array<{ studentId: number; userId: number }> - Danh sách học sinh/user đã xóa.
   * - data.avatarFileResults: Array<{ mediaId: number; bucketName: string; objectKey: string; status: "deleted" | "failed"; reason?: string }>
   *   - Kết quả xóa từng file avatar trên MinIO.
   */
  @Post('students/hard-delete-by-graduation-year-grade-excluded-courses')
  @RequirePermission(PERMISSION_CODES.STUDENT.UPDATE)
  @HttpCode(HttpStatus.OK)
  async hardDeleteStudentsByGraduationYearGradeExcludedCourses(
    @Body() dto: HardDeleteStudentsByGraduationYearGradeExcludedCoursesDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() =>
      this.hardDeleteStudentsByGraduationYearGradeExcludedCoursesUseCase.execute(dto, adminId),
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
    return ExceptionHandler.execute(() => this.superAdminUpdateAdminDirectUseCase.execute(dto))
  }

  /**
   * Tim va xoa cung tat ca media khong co usage va da tao qua 30 ngay.
   * POST /super-admin/cleanup-unused-media-older-than-30-days
   *
   * Xu ly:
   * - Lay toan bo media co createdAt <= now - 30 ngay
   * - Chi xoa media khong con media usage
   * - Xoa file tren MinIO truoc, sau do xoa ban ghi media trong DB
   *
   * Output:
   * - olderThanDays: number
   * - cutoffDate: string
   * - totalCandidates: number
   * - deletedCount: number
   * - skippedCount: number
   * - failedCount: number
   * - results: danh sach ket qua tung media
   */
  @Post('cleanup-unused-media-older-than-30-days')
  @RequirePermission(PERMISSION_CODES.MEDIA.PERMANENT_DELETE)
  @HttpCode(HttpStatus.OK)
  async cleanupUnusedMediaOlderThan30Days(@CurrentUser('adminId') _adminId?: number): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() => this.cleanupUnusedMediaOlderThan30DaysUseCase.execute())
  }

  /**
   * Generate slug cho tat ca exam chua co slug.
   * POST /super-admin/exams/generate-missing-slugs
   *
   * Output:
   * - totalCandidates: number
   * - updatedCount: number
   * - skippedCount: number
   * - results: danh sach ket qua tung exam
   */
  @Post('exams/generate-missing-slugs')
  @RequirePermission(PERMISSION_CODES.EXAM.UPDATE)
  @HttpCode(HttpStatus.OK)
  async generateMissingExamSlugs(@CurrentUser('adminId') _adminId?: number): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() => this.generateMissingExamSlugsUseCase.execute())
  }

  /**
   * Regenerate slug cho question co slug dang question-123.
   * POST /super-admin/questions/regenerate-slugs
   *
   * Output:
   * - totalCandidates: number
   * - updatedCount: number
   * - skippedCount: number
   * - results: danh sach ket qua tung question
   */
  @Post('questions/regenerate-slugs')
  @RequirePermission(PERMISSION_CODES.QUESTION.UPDATE)
  @HttpCode(HttpStatus.OK)
  async regenerateQuestionSlugs(@CurrentUser('adminId') _adminId?: number): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() => this.regenerateQuestionSlugsUseCase.execute())
  }

  /**
   * Seed cac tag mac dinh bang upsert.
   * POST /super-admin/tags/seed-defaults
   *
   * Thu tu seed:
   * - CHAPTER tu CHAPTERS
   * - SUBJECT tu SUBJECTS
   * - DOCUMENT_TYPE tu DOCUMENT_TYPE_TAGS
   * - LEVEL tu LEVEL_TAGS
   */
  @Post('tags/seed-defaults')
  @RequirePermission(PERMISSION_CODES.ADMIN.CREATE)
  @HttpCode(HttpStatus.OK)
  async seedDefaultTags(@CurrentUser('adminId') _adminId?: number): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() => this.seedDefaultTagsUseCase.execute())
  }

  /**
   * Sync all permission codes from src/shared/constants/permissions/permission.codes.ts into DB.
   * POST /api/super-admin/permissions/sync-from-codes
   *
   * Input:
   * - No body/query params.
   *
   * Output:
   * - source: source constant file path
   * - totalFromSource: total permission code entries read from PERMISSION_CODES
   * - totalUnique: total unique permission codes upserted by code
   * - createdCount: number of newly inserted permissions
   * - updatedCount: number of existing permissions whose metadata was changed
   * - unchangedCount: number of existing permissions already matching the source
   * - duplicateCodes: duplicate code report if the source contains duplicate values
   * - permissions: sync result for each unique permission code
   */
  @Post('permissions/sync-from-codes')
  @RequirePermission(PERMISSION_CODES.PERMISSION.SYNC_FROM_CODES)
  @HttpCode(HttpStatus.OK)
  async syncPermissionsFromCodes(@CurrentUser('adminId') _adminId?: number): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() => this.syncPermissionsFromCodesUseCase.execute())
  }

  /**
   * Exchange short-lived Facebook token sang long-lived token.
   * POST /super-admin/facebook/exchange-access-token
   *
   * Input:
   * - appId: string
   * - appSecret: string
   * - shortLivedToken: string
   */
  @Post('facebook/exchange-access-token')
  @HttpCode(HttpStatus.OK)
  async exchangeFacebookAccessToken(
    @Body() dto: ExchangeFacebookTokenDto,
    @CurrentUser('adminId') _adminId?: number,
  ): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(async () => {
      console.log('Received request to exchange Facebook access token with data:', dto)
      const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: dto.appId,
          client_secret: dto.appSecret,
          fb_exchange_token: dto.shortLivedToken,
        },
        timeout: 15000,
      })

      return BaseResponseDto.success('Exchange Facebook access token thành công', response.data)
    })
  }
}
