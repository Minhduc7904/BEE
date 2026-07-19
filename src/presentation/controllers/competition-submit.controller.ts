// src/presentation/controllers/competition-submit.controller.ts
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
} from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import type { Response } from 'express'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
  GetAllCompetitionSubmitsUseCase,
  GetStudentCompetitionSubmitsUseCase,
  GetCompetitionSubmitByIdUseCase,
  DeleteCompetitionSubmitUseCase,
  GetAdminCompetitionSubmitDetailUseCase,
  RegradeCompetitionSubmitUseCase,
  UpdateCompetitionSubmitUseCase,
  ExportCompetitionSubmitScoreListUseCase,
} from '../../application/use-cases/competition-submit'
import {
  CompetitionSubmitListQueryDto,
  StudentCompetitionSubmitListQueryDto,
  CompetitionSubmitResponseDto,
  CompetitionSubmitListResponseDto,
  AdminCompetitionSubmitDetailDto,
  AdminCompetitionSubmitDetailResponseDto,
  UpdateCompetitionSubmitDto,
  ExportCompetitionSubmitScoreListOptionDto,
} from '../../application/dtos/competition-submit'

/**
 * Controller quản lý bài nộp cuộc thi (dành cho admin).
 * Khác với DoCompetitionController (học sinh làm bài),
 * controller này dùng để xem & quản lý kết quả nộp bài từ phía quản trị.
 *
 * ─── ENDPOINTS ───────────────────────────────────────────────────────────────
 *
 * GET  /competition-submits
 *   Lấy danh sách bài nộp có phân trang, lọc theo:
 *   competitionId, studentId, status, attemptNumber, isGraded, startedFrom/To
 *
 * GET  /competition-submits/:id
 *   Lấy chi tiết 1 bài nộp theo ID (bao gồm answers nếu có)
 *
 * DELETE /competition-submits/:id
 *   Xoá bài nộp (admin only, ghi audit log)
 */
@Injectable()
@Controller('competition-submits')
export class CompetitionSubmitController {
  constructor(
    private readonly getAllCompetitionSubmitsUseCase: GetAllCompetitionSubmitsUseCase,
    private readonly getStudentCompetitionSubmitsUseCase: GetStudentCompetitionSubmitsUseCase,
    private readonly getCompetitionSubmitByIdUseCase: GetCompetitionSubmitByIdUseCase,
    private readonly deleteCompetitionSubmitUseCase: DeleteCompetitionSubmitUseCase,
    private readonly getAdminCompetitionSubmitDetailUseCase: GetAdminCompetitionSubmitDetailUseCase,
    private readonly regradeCompetitionSubmitUseCase: RegradeCompetitionSubmitUseCase,
    private readonly updateCompetitionSubmitUseCase: UpdateCompetitionSubmitUseCase,
    private readonly exportCompetitionSubmitScoreListUseCase: ExportCompetitionSubmitScoreListUseCase,
  ) {}

  /**
   * Lấy danh sách bài nộp cuộc thi (admin).
   *
   * @route GET /competition-submits
   *
   * ─── ĐẦU VÀO ─────────────────────────────────────────────────────────────
   * @query page           Trang hiện tại (mặc định 1)
   * @query limit          Kích thước trang, tối đa 100 (mặc định 10)
   * @query sortBy         Trường sắp xếp (mặc định startedAt)
   * @query sortOrder      Chiều sắp xếp: asc | desc (mặc định desc)
   * @query competitionId  Lọc theo cuộc thi
   * @query studentId      Lọc theo học sinh
   * @query status         Lọc theo trạng thái: IN_PROGRESS | SUBMITTED | GRADED | ABANDONED
   * @query attemptNumber  Lọc theo lần làm thứ N
   * @query isGraded       Lọc bài đã chấm (true/false)
   * @query startedFrom    Lọc từ ngày bắt đầu làm (ISO date string)
   * @query startedTo      Lọc đến ngày bắt đầu làm (ISO date string)
   * @query search         Tìm theo tên học sinh hoặc SĐT học sinh/phụ huynh (không phân biệt hoa/thường, có hỗ trợ không dấu)
   *
   * ─── ĐẦU RA ─────────────────────────────────────────────────────────────
   * @returns CompetitionSubmitListResponseDto
   *   data.competitionSubmits[] - danh sách bài nộp
   *   data.pagination.{total, page, limit, totalPages}
   */
  @Get()
  @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllCompetitionSubmits(
    @Query() query: CompetitionSubmitListQueryDto,
  ): Promise<CompetitionSubmitListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllCompetitionSubmitsUseCase.execute(query))
  }

  /**
   * Export danh sach diem bai nop competition ra file Excel.
   *
   * Endpoint:
   * - Method: GET
   * - Full path: /api/competition-submits/export/excel
   * - Controller path: /competition-submits/export/excel
   *
   * Permission:
   * - COMPETITION_SUBMIT.EXPORT_EXCEL (`competition-submit:export-excel`).
   *
   * Request query:
   * - Option hoc sinh giong GET /api/students/export/excel:
   *   page, limit, search, sortBy, sortOrder, grade, highSchoolGraduationYear,
   *   isActive, hasParentZaloId, classIds, includeSchool, includeGender,
   *   includeDateOfBirth, includeUsername, includeParentPhone, includeStudentPhone,
   *   includeGrade, includeHighSchoolGraduationYear, includeEmail, includeIsActive,
   *   includeCreatedAt, includeClasses.
   * - Filter competition submit:
   *   competitionId?: number.
   *   studentId?: number.
   *   status?: IN_PROGRESS | SUBMITTED | GRADED | ABANDONED.
   *   attemptNumber?: number.
   *   isGraded?: boolean.
   *   startedFrom?: ISO date string.
   *   startedTo?: ISO date string.
   *   submittedFrom?: ISO date string.
   *   submittedTo?: ISO date string.
   * - Option cot:
   *   includeCompetitionSubmitColumns?: boolean, default true.
   *   includeQuestionColumns?: boolean, default true. Neu false thi khong xuat cac cot Cau 1..Cau N.
   *
   * Excel output:
   * - Cac cot thong tin hoc sinh dung thu tu nhu Student export:
   *   STT, Ma hoc sinh, Ho va ten, SDT hoc sinh neu bat, SDT phu huynh,
   *   Truong, Gioi tinh, Ngay sinh, Ten dang nhap, Khoi, Nam tot nghiep cap 3,
   *   Email, Trang thai, Ngay tao, cac cot lop.
   * - Them cac cot competition submit:
   *   Competition, Ma bai nop, Lan lam, Trang thai bai nop, Diem, Diem toi da,
   *   Ti le diem (%), Thoi gian lam, Bat dau luc, Nop luc, Cham luc, Nhan xet.
   * - Neu includeQuestionColumns=true, them cac cot Cau 1..Cau N:
   *   dung = `v`, sai = `x`, khong tra loi hoac chua cham = rong.
   *
   * Response:
   * - HTTP 200 OK.
   * - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.
   * - Content-Disposition: attachment; filename="<encoded filename>.xlsx".
   * - Body: StreamableFile chua buffer file .xlsx.
   *
   * @example
   * GET /api/competition-submits/export/excel?competitionId=1&status=GRADED&includeQuestionColumns=true&includeStudentPhone=true
   */
  @Get('export/excel')
  @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.EXPORT_EXCEL)
  @HttpCode(HttpStatus.OK)
  async exportCompetitionSubmitScoreList(
    @Query() options: ExportCompetitionSubmitScoreListOptionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return ExceptionHandler.execute(async () => {
      const { buffer, filename } = await this.exportCompetitionSubmitScoreListUseCase.execute(options)

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      })

      return new StreamableFile(buffer)
    })
  }

  /**
   * Get the competition-submit list of one student for administration screens.
   *
   * Request example:
   *   GET /api/competition-submits/student/25?page=1&limit=20&competitionId=8&isGraded=true&sortBy=gradedAt&sortOrder=desc
   *
   * Supported filters:
   * - competitionId, graderId, status, isGraded.
   * - startedFrom/startedTo and submittedFrom/submittedTo as ISO dates.
   * - search matches the competition title or grader feedback.
   * - sortBy: startedAt | submittedAt | gradedAt | totalPoints | maxPoints |
   *   timeSpentSeconds | attemptNumber | createdAt | updatedAt.
   *
   * Performance contract:
   * - Returns only the competition id/title and compact grader information.
   * - Does not query CompetitionAnswer, Question, Statement, or exam content.
   *
   * Response example:
   * {
   *   "success": true,
   *   "data": {
   *     "student": { "studentId": 25, "fullName": "Nguyen Van A" },
   *     "competitionSubmits": [{
   *       "competitionSubmitId": 99,
   *       "status": "GRADED",
   *       "totalPoints": 8.5,
   *       "maxPoints": 10,
   *       "competition": { "competitionId": 8, "title": "Kiem tra chuong 1" },
   *       "grader": { "adminId": 3, "fullName": "Tran Thi B" }
   *     }],
   *     "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
   *   }
   * }
   */
  @Get('student/:studentId')
  @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.GET_BY_STUDENT)
  @HttpCode(HttpStatus.OK)
  async getStudentCompetitionSubmits(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: StudentCompetitionSubmitListQueryDto,
  ): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() => this.getStudentCompetitionSubmitsUseCase.execute(studentId, query))
  }

  /**
   * Lấy chi tiết 1 bài nộp theo ID.
   *
   * @route GET /competition-submits/:id
   *
   * ─── ĐẦU VÀO ─────────────────────────────────────────────────────────────
   * @param id  ID của bài nộp (CompetitionSubmit.competitionSubmitId)
   *
   * ─── ĐẦU RA ─────────────────────────────────────────────────────────────
   * @returns BaseResponseDto<CompetitionSubmitResponseDto>
   *   - competitionSubmitId, competitionId, studentId, attemptNumber
   *   - status: IN_PROGRESS | SUBMITTED | GRADED | ABANDONED
   *   - startedAt, submittedAt, gradedAt, timeSpentSeconds
   *   - totalPoints, maxPoints, scorePercentage
   *   - isInProgress, isSubmitted, isGraded, isAbandoned, hasScore
   *   - competition?: thông tin cuộc thi
   *   - student?: thông tin học sinh
   *   - competitionAnswers?: danh sách câu trả lời
   */
  @Get(':id')
  @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getCompetitionSubmitById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<CompetitionSubmitResponseDto>> {
    return ExceptionHandler.execute(() => this.getCompetitionSubmitByIdUseCase.execute(id))
  }

  /**
   * [Admin] Lấy chi tiết đầy đủ bài nộp cuộc thi.
   *
   * @route GET /competition-submits/:id/detail
   *
   * ─── ĐẦU VÀO ─────────────────────────────────────────────────────────────
   * @param id  ID của bài nộp (CompetitionSubmit.competitionSubmitId)
   *
   * ─── ĐẦU RA ─────────────────────────────────────────────────────────────
   * @returns AdminCompetitionSubmitDetailResponseDto
   *   - Thông tin bài nộp (status, điểm, thời gian…)
   *   - student: thông tin học sinh
   *   - competition: thông tin cuộc thi
   *   - answers[]: danh sách câu trả lời, mỗi câu kèm:
   *       + question: nội dung câu hỏi, đáp án đúng, lời giải
   *       + question.statements[]: tất cả mệnh đề có isCorrect
   *       + isCorrect, points: kết quả chấm điểm
   *   - totalAnswers, correctAnswers, incorrectAnswers, unansweredQuestions
   */
  @Get(':id/detail')
  @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getAdminCompetitionSubmitDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<AdminCompetitionSubmitDetailDto>> {
    return ExceptionHandler.execute(() => this.getAdminCompetitionSubmitDetailUseCase.execute(id))
  }

  /**
   * [Admin] Chấm điểm lại bài nộp cuộc thi.
   *
   * @route POST /competition-submits/:id/regrade
   *
   * ─── ĐẦU VÀO ─────────────────────────────────────────────────────────────
   * @param id  ID của bài nộp cần chấm lại (CompetitionSubmit.competitionSubmitId)
   *
   * ─── ĐẦU RA ─────────────────────────────────────────────────────────────
   * @returns BaseResponseDto<any>
   *   - competitionSubmitId, competitionId, studentId, attemptNumber
   *   - status: GRADED
   *   - gradedAt: thời điểm chấm lại
   *   - totalPoints, maxPoints, scorePercentage: điểm sau khi chấm lại
   *   - answersRegraded: số câu được chấm lại
   *   - totalAnswers: tổng số câu trả lời
   */
  @Post(':id/regrade')
  @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.REGRADE)
  @HttpCode(HttpStatus.OK)
  async regradeCompetitionSubmit(@Param('id', ParseIntPipe) id: number): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() => this.regradeCompetitionSubmitUseCase.execute(id))
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateCompetitionSubmit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompetitionSubmitDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<CompetitionSubmitResponseDto>> {
    return ExceptionHandler.execute(() => this.updateCompetitionSubmitUseCase.execute(id, dto, adminId))
  }

  /**
   * Xoá bài nộp cuộc thi (admin).
   *
   * @route DELETE /competition-submits/:id
   *
   * ─── ĐẦU VÀO ─────────────────────────────────────────────────────────────
   * @param id  ID của bài nộp cần xoá
   *
   * ─── ĐẦU RA ─────────────────────────────────────────────────────────────
   * @returns BaseResponseDto<null> — success: true nếu xoá thành công
   * @throws NotFoundException nếu bài nộp không tồn tại
   */
  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.DELETE)
  @HttpCode(HttpStatus.OK)
  async deleteCompetitionSubmit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<null>> {
    return ExceptionHandler.execute(() => this.deleteCompetitionSubmitUseCase.execute(id, adminId))
  }
}
