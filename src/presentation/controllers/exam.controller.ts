// src/presentation/controllers/exam.controller.ts
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
import { Injectable } from '@nestjs/common'
import {
  ExamResponseDto,
  ExamListResponseDto,
  CreateExamDto,
  UpdateExamDto,
  ExamListQueryDto,
  PublicStudentExamListQueryDto,
  PublicStudentExamContentQueryDto,
  PublicStudentExamListResponseDto,
  PublicStudentExamDetailResponseDto,
  PublicExamTypeCountResponseDto,
} from '../../application/dtos/exam'
import { PublicStudentCompetitionExamResponseDto } from '../../application/dtos/competition'
import { QuestionListResponseDto, QuestionByExamQueryDto } from '../../application/dtos/question'
import { SectionResponseDto } from '../../application/dtos/section'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
  GetAllExamsUseCase,
  GetExamByIdUseCase,
  CreateExamUseCase,
  UpdateExamUseCase,
  DeleteExamUseCase,
  SearchExamsUseCase,
  GetPublicExamTypeCountsUseCase,
  GetPublicStudentExamsUseCase,
  GetPublicStudentExamByIdUseCase,
  GetPublicStudentExamContentUseCase,
} from '../../application/use-cases/exam'
import { GetQuestionsByExamUseCase } from '../../application/use-cases/question'
import { GetSectionsByExamUseCase } from '../../application/use-cases/section'
import { ExamVisibility } from 'src/shared/enums'

@Injectable()
@Controller('exams')
export class ExamController {
  constructor(
    private readonly getAllExamsUseCase: GetAllExamsUseCase,
    private readonly getExamByIdUseCase: GetExamByIdUseCase,
    private readonly createExamUseCase: CreateExamUseCase,
    private readonly updateExamUseCase: UpdateExamUseCase,
    private readonly deleteExamUseCase: DeleteExamUseCase,
    private readonly searchExamsUseCase: SearchExamsUseCase,
    private readonly getPublicExamTypeCountsUseCase: GetPublicExamTypeCountsUseCase,
    private readonly getPublicStudentExamsUseCase: GetPublicStudentExamsUseCase,
    private readonly getPublicStudentExamByIdUseCase: GetPublicStudentExamByIdUseCase,
    private readonly getPublicStudentExamContentUseCase: GetPublicStudentExamContentUseCase,
    private readonly getQuestionsByExamUseCase: GetQuestionsByExamUseCase,
    private readonly getSectionsByExamUseCase: GetSectionsByExamUseCase,
  ) { }

  /**
   * Get my exams (created by current user)
   *
   * @route GET /exams/my-exams
   * @param query - Query parameters (page, limit, subjectId, grade, visibility, etc.)
   * @param adminId - Current admin ID (auto-injected)
   * @returns Paginated list of exams created by current user
   *
   * @example
   * GET /exams/my-exams?page=1&limit=10&grade=10
   */
  @Get('my-exams')
  @RequirePermission(PERMISSION_CODES.EXAM.GET_MY_EXAMS)
  @HttpCode(HttpStatus.OK)
  async getMyExams(
    @Query() query: ExamListQueryDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<ExamListResponseDto> {
    // Automatically filter by current user's adminId
    query.createdBy = adminId
    return ExceptionHandler.execute(() => this.getAllExamsUseCase.execute(query))
  }

  /**
   * Search exams
   *
   * @route GET /exams/search
   * @param query - Query parameters (search, page, limit, subjectId, grade, visibility, etc.)
   * @returns Paginated list of exams matching search criteria
   *
   * @example
   * GET /exams/search?search=toán&page=1&limit=10&grade=10
   */
  @Get('search')
  @RequirePermission(PERMISSION_CODES.EXAM.SEARCH)
  @HttpCode(HttpStatus.OK)
  async searchExams(
    @Query() query: ExamListQueryDto,
    @CurrentUser() user?: any,
  ): Promise<ExamListResponseDto> {
    // All permission logic is handled in the UseCase
    const context = {
      user: {
        adminId: user?.adminId,
        studentId: user?.studentId,
        permissions: user?.permissions ?? [],
      },
    }

    return ExceptionHandler.execute(() =>
      this.searchExamsUseCase.execute(query, context),
    )
  }

  /**
   * Get all exams with filters
   *
   * @route GET /exams
    * @param query - Query parameters (page, limit, subjectId, chapterIds, grade, visibility, etc.)
   * @returns Paginated list of exams
   *
   * @example
   * GET /exams?page=1&limit=10&subjectId=5&grade=10
    * GET /exams?page=1&limit=10&chapterIds=5&chapterIds=6
   */
  @Get()
  @RequirePermission(PERMISSION_CODES.EXAM.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllExams(@Query() query: ExamListQueryDto): Promise<ExamListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllExamsUseCase.execute(query))
  }

  /**
   * Đếm số lượng đề thi public theo từng loại đề (dành cho học sinh)
   *
   * @route GET /exams/public/type-counts
   * @returns Thống kê số lượng đề thi PUBLISHED theo từng typeOfExam
   *
   * @example
   * GET /exams/public/type-counts
   * Response: {
   *   "success": true,
   *   "message": "Lấy thống kê số lượng đề thi public theo loại thành công",
   *   "data": {
   *     "totalPublished": 128,
   *     "items": [
   *       { "typeOfExam": "CK1", "label": "Cuối kỳ 1", "total": 15 },
   *       { "typeOfExam": "CK2", "label": "Cuối kỳ 2", "total": 14 },
   *       { "typeOfExam": "GK1", "label": "Giữa kỳ 1", "total": 21 },
   *       { "typeOfExam": "GK2", "label": "Giữa kỳ 2", "total": 19 },
   *       { "typeOfExam": "TSA", "label": "Tuyển sinh Đại học", "total": 9 },
   *       { "typeOfExam": "THPT", "label": "THPT Quốc Gia", "total": 18 },
   *       { "typeOfExam": "OTTHPT", "label": "Ôn tập THPT", "total": 10 },
   *       { "typeOfExam": "OT", "label": "Ôn tập", "total": 8 },
   *       { "typeOfExam": "HSA", "label": "Học sinh giỏi", "total": 7 },
   *       { "typeOfExam": "OTHS", "label": "Ôn tập chung", "total": 7 }
   *     ]
   *   }
   * }
   */
  @Get('public/type-counts')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getPublicExamTypeCounts(): Promise<BaseResponseDto<PublicExamTypeCountResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicExamTypeCountsUseCase.execute())
  }

  /**
   * Lấy danh sách đề thi public cho học sinh (có lọc + phân trang)
   *
   * @route GET /exams/public/student
    * @param query - Query params: page, limit, search, grade, typeOfExam, subjectId, chapterIds, sortBy, sortOrder
   * @returns Danh sách đề thi có visibility = PUBLISHED
   *
   * @example
   * GET /exams/public/student?page=1&limit=10&grade=10&typeOfExam=GK1&search=toán
   * Response: {
   *   "success": true,
   *   "message": "Lấy danh sách đề thi public thành công",
   *   "data": [
   *     {
   *       "examId": 123,
   *       "title": "Đề thi giữa kỳ 1 Toán 10",
   *       "grade": 10,
   *       "visibility": "PUBLISHED",
   *       "typeOfExam": "GK1",
   *       "subjectId": 5,
   *       "subjectName": "Toán",
   *       "questionCount": 40
   *     }
   *   ],
   *   "meta": {
   *     "page": 1,
   *     "limit": 10,
   *     "total": 56,
   *     "totalPages": 6,
   *     "hasPrevious": false,
   *     "hasNext": true,
   *     "nextPage": 2
   *   }
   * }
   */
  @Get('public/student')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getPublicStudentExams(
    @Query() query: PublicStudentExamListQueryDto,
    @CurrentUser('studentId') studentId?: number,
  ): Promise<PublicStudentExamListResponseDto> {
    return ExceptionHandler.execute(() => this.getPublicStudentExamsUseCase.execute(query, studentId))
  }

  /**
   * Tìm kiếm đề thi public cho học sinh (search + filter + phân trang)
   *
   * @route GET /exams/public/student/search
    * @param query - Query params: search, page, limit, grade, typeOfExam, subjectId, chapterIds, sortBy, sortOrder
   * @returns Danh sách đề thi public phù hợp từ khóa tìm kiếm
   *
   * @example
   * GET /exams/public/student/search?search=toán&page=1&limit=10&typeOfExam=GK1
   */
  @Get('public/student/search')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async searchPublicStudentExams(
    @Query() query: PublicStudentExamListQueryDto,
    @CurrentUser('studentId') studentId?: number,
  ): Promise<PublicStudentExamListResponseDto> {
    return ExceptionHandler.execute(() => this.getPublicStudentExamsUseCase.execute(query, studentId))
  }

  /**
   * Lấy nội dung đề thi public cho học sinh (sections + questions)
   *
   * @route GET /exams/public/student/:id/exam
   * @param id - Exam ID
   * @param query - Query params: questionIds (optional)
   * @returns Response giống PublicStudentCompetitionExamResponseDto
   *
   * @example
   * GET /exams/public/student/123/exam
   * GET /exams/public/student/123/exam?questionIds=11&questionIds=12
   */
  @Get('public/student/:id/exam')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getPublicStudentExamContent(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PublicStudentExamContentQueryDto,
  ): Promise<PublicStudentCompetitionExamResponseDto> {
    return ExceptionHandler.execute(() => this.getPublicStudentExamContentUseCase.execute(id, query))
  }

  /**
   * Lấy chi tiết đề thi cho học sinh (chỉ áp dụng đề thi public)
   *
   * @route GET /exams/public/student/:id
   * @param id - Exam ID
   * @returns Chi tiết đề thi nếu đề có visibility = PUBLISHED
   *
   * @example
   * GET /exams/public/student/123
   */
  @Get('public/student/:id')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getPublicStudentExamById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('studentId') studentId?: number,
  ): Promise<BaseResponseDto<PublicStudentExamDetailResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicStudentExamByIdUseCase.execute(id, studentId))
  }

  /**
   * Get exam by ID
   *
   * @route GET /exams/:id
   * @param id - Exam ID
   * @returns Exam details with questions and competitions
   *
   * @example
   * GET /exams/123
   */
  @Get(':id')
  @RequirePermission(PERMISSION_CODES.EXAM.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getExamById(@Param('id', ParseIntPipe) id: number): Promise<BaseResponseDto<ExamResponseDto>> {
    return ExceptionHandler.execute(() => this.getExamByIdUseCase.execute(id))
  }

  /**
   * Create new exam
   *
   * @route POST /exams
   * @param dto - Exam data
   * @param adminId - Current admin ID
   * @returns Created exam
   *
   * @example
   * POST /exams
   * Body: {
   *   "title": "Đề thi Toán học kỳ 1",
   *   "grade": 10,
   *   "visibility": "DRAFT",
   *   "subjectId": 5,
   *   "description": "Đề thi giữa kỳ"
   * }
   */
  @Post()
  @RequirePermission(PERMISSION_CODES.EXAM.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createExam(
    @Body() dto: CreateExamDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<ExamResponseDto>> {
    return ExceptionHandler.execute(() => this.createExamUseCase.execute(dto, adminId))
  }

  /**
   * Update exam
   *
   * @route PUT /exams/:id
   * @param id - Exam ID
   * @param dto - Updated exam data
   * @param adminId - Current admin ID
   * @returns Updated exam
   *
   * @example
   * PUT /exams/123
   * Body: {
   *   "title": "Đề thi Toán học kỳ 2",
   *   "visibility": "PUBLISHED"
   * }
   */
  @Put(':id')
  @RequirePermission(PERMISSION_CODES.EXAM.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateExam(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<ExamResponseDto>> {
    return ExceptionHandler.execute(() => this.updateExamUseCase.execute(id, dto, adminId))
  }

  /**
   * Delete exam
   *
   * @route DELETE /exams/:id
   * @param id - Exam ID
   * @param adminId - Current admin ID
   * @returns Success message
   *
   * @example
   * DELETE /exams/123
   */
  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.EXAM.DELETE)
  @HttpCode(HttpStatus.OK)
  async deleteExam(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<boolean>> {
    return ExceptionHandler.execute(() => this.deleteExamUseCase.execute(id, adminId))
  }

  /**
   * Get all questions for a specific exam
   *
   * @route GET /exams/:id/questions
   * @param id - Exam ID
   * @param query - Query parameters (page, limit, type, difficulty, etc.)
   * @returns Paginated list of questions for the exam
   *
   * @example
   * GET /exams/123/questions?page=1&limit=10&type=SINGLE_CHOICE
   */
  @Get(':id/questions')
  @RequirePermission(PERMISSION_CODES.QUESTION.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getQuestionsByExam(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QuestionByExamQueryDto,
  ): Promise<QuestionListResponseDto> {
    return ExceptionHandler.execute(() => this.getQuestionsByExamUseCase.execute(id, query))
  }

  /**
   * Get all sections for a specific exam
   *
   * @route GET /exams/:id/sections
   * @param id - Exam ID
   * @returns List of sections for the exam ordered by 'order' field
   *
   * @example
   * GET /exams/123/sections
   */
  @Get(':id/sections')
  @RequirePermission(PERMISSION_CODES.SECTION.GET_BY_EXAM)
  @HttpCode(HttpStatus.OK)
  async getSectionsByExam(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<SectionResponseDto[]>> {
    return ExceptionHandler.execute(() => this.getSectionsByExamUseCase.execute(id))
  }
}
