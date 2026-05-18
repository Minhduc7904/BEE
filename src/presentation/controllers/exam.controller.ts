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
  PublicSeoExamDetailResponseDto,
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
  GetPublicStudentExamBySlugUseCase,
  GetPublicStudentExamContentUseCase,
  GetPublicSeoRelatedExamsBySlugUseCase,
  GetPublicSeoLatestExamsUseCase,
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
    private readonly getPublicStudentExamBySlugUseCase: GetPublicStudentExamBySlugUseCase,
    private readonly getPublicStudentExamContentUseCase: GetPublicStudentExamContentUseCase,
    private readonly getPublicSeoRelatedExamsBySlugUseCase: GetPublicSeoRelatedExamsBySlugUseCase,
    private readonly getPublicSeoLatestExamsUseCase: GetPublicSeoLatestExamsUseCase,
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
   * GET /exams/search?search=toÃ¡n&page=1&limit=10&grade=10
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
   * Äáº¿m sá»‘ lÆ°á»£ng Ä‘á» thi public theo tá»«ng loáº¡i Ä‘á» (dÃ nh cho há»c sinh)
   *
   * @route GET /exams/public/type-counts
   * @returns Thá»‘ng kÃª sá»‘ lÆ°á»£ng Ä‘á» thi PUBLISHED theo tá»«ng typeOfExam
   *
   * @example
   * GET /exams/public/type-counts
   * Response: {
   *   "success": true,
   *   "message": "Láº¥y thá»‘ng kÃª sá»‘ lÆ°á»£ng Ä‘á» thi public theo loáº¡i thÃ nh cÃ´ng",
   *   "data": {
   *     "totalPublished": 128,
   *     "items": [
   *       { "typeOfExam": "CK1", "label": "Cuá»‘i ká»³ 1", "total": 15 },
   *       { "typeOfExam": "CK2", "label": "Cuá»‘i ká»³ 2", "total": 14 },
   *       { "typeOfExam": "GK1", "label": "Giá»¯a ká»³ 1", "total": 21 },
   *       { "typeOfExam": "GK2", "label": "Giá»¯a ká»³ 2", "total": 19 },
   *       { "typeOfExam": "TSA", "label": "Tuyá»ƒn sinh Äáº¡i há»c", "total": 9 },
   *       { "typeOfExam": "THPT", "label": "THPT Quá»‘c Gia", "total": 18 },
   *       { "typeOfExam": "OTTHPT", "label": "Ã”n táº­p THPT", "total": 10 },
   *       { "typeOfExam": "OT", "label": "Ã”n táº­p", "total": 8 },
   *       { "typeOfExam": "HSA", "label": "Há»c sinh giá»i", "total": 7 },
   *       { "typeOfExam": "OTHS", "label": "Ã”n táº­p chung", "total": 7 }
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
   * Láº¥y danh sÃ¡ch Ä‘á» thi public cho há»c sinh (cÃ³ lá»c + phÃ¢n trang)
   *
   * @route GET /exams/public/student
    * @param query - Query params: page, limit, search, grade, typeOfExam, subjectId, chapterIds, sortBy, sortOrder
   * @returns Danh sÃ¡ch Ä‘á» thi cÃ³ visibility = PUBLISHED
   *
   * @example
   * GET /exams/public/student?page=1&limit=10&grade=10&typeOfExam=GK1&search=toÃ¡n
   * Response: {
   *   "success": true,
   *   "message": "Láº¥y danh sÃ¡ch Ä‘á» thi public thÃ nh cÃ´ng",
   *   "data": [
   *     {
   *       "examId": 123,
   *       "title": "Äá» thi giá»¯a ká»³ 1 ToÃ¡n 10",
   *       "grade": 10,
   *       "visibility": "PUBLISHED",
   *       "typeOfExam": "GK1",
   *       "subjectId": 5,
   *       "subjectName": "ToÃ¡n",
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
   * TÃ¬m kiáº¿m Ä‘á» thi public cho há»c sinh (search + filter + phÃ¢n trang)
   *
   * @route GET /exams/public/student/search
    * @param query - Query params: search, page, limit, grade, typeOfExam, subjectId, chapterIds, sortBy, sortOrder
   * @returns Danh sÃ¡ch Ä‘á» thi public phÃ¹ há»£p tá»« khÃ³a tÃ¬m kiáº¿m
   *
   * @example
   * GET /exams/public/student/search?search=toÃ¡n&page=1&limit=10&typeOfExam=GK1
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
   * Láº¥y ná»™i dung Ä‘á» thi public cho há»c sinh (sections + questions)
   *
   * @route GET /exams/public/student/:id/exam
   * @param id - Exam ID
   * @param query - Query params: questionIds (optional)
   * @returns Response giá»‘ng PublicStudentCompetitionExamResponseDto
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
   * Láº¥y chi tiáº¿t Ä‘á» thi cho há»c sinh (chá»‰ Ã¡p dá»¥ng Ä‘á» thi public)
   *
   * @route GET /exams/public/student/:id
   * @param id - Exam ID
   * @returns Chi tiáº¿t Ä‘á» thi náº¿u Ä‘á» cÃ³ visibility = PUBLISHED
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
   * Láº¥y chi tiáº¿t Ä‘á» thi public cho SEO (khÃ´ng yÃªu cáº§u permission/auth)
   *
   * @route GET /exams/public/seo/:slug
   * @param slug - Exam slug
   * @returns Chi tiáº¿t Ä‘á» thi náº¿u Ä‘á» cÃ³ visibility = PUBLISHED
   *
   * @example
   * GET /exams/public/seo/de-thi-cuoi-hoc-ky
   */
  @Get('public/seo/latest')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoLatestExams(): Promise<PublicStudentExamListResponseDto> {
    return ExceptionHandler.execute(async () => {
      const response = await this.getPublicSeoLatestExamsUseCase.execute(4)
      if (response.data) {
        for (const item of response.data) {
          delete (item as any).createdByAdmin
        }
      }
      return response
    })
  }

  @Get('public/seo/:slug/related')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoRelatedExamsBySlug(
    @Param('slug') slug: string,
  ): Promise<PublicStudentExamListResponseDto> {
    return ExceptionHandler.execute(async () => {
      const response = await this.getPublicSeoRelatedExamsBySlugUseCase.execute(slug, 10)
      if (response.data) {
        for (const item of response.data) {
          delete (item as any).createdByAdmin
        }
      }
      return response
    })
  }
  
  @Get('public/seo/:slug')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoExamBySlug(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<PublicSeoExamDetailResponseDto>> {
    return ExceptionHandler.execute(async () => {
      const response = await this.getPublicStudentExamBySlugUseCase.execute(slug)
      return response
    })
  }

  /**
   * Láº¥y danh sÃ¡ch Ä‘á» thi public cho SEO (khÃ´ng yÃªu cáº§u permission/auth)
   *
   * @route GET /exams/public/seo
   * @param query - Query params: page, limit, search, grade, typeOfExam, subjectId, chapterIds, sortBy, sortOrder
   * @returns Danh sÃ¡ch Ä‘á» thi cÃ³ visibility = PUBLISHED
   *
   * @example
   * GET /exams/public/seo?page=1&limit=10&grade=10
   */
  @Get('public/seo')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoExams(
    @Query() query: PublicStudentExamListQueryDto,
  ): Promise<PublicStudentExamListResponseDto> {
    return ExceptionHandler.execute(async () => {
      const response = await this.getPublicStudentExamsUseCase.execute(query, undefined, {
        renderDescriptionHtml: true,
      })
      if (response.data) {
        for (const item of response.data) {
          delete (item as any).createdByAdmin
        }
      }
      return response
    })
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
   *   "title": "Äá» thi ToÃ¡n há»c ká»³ 1",
   *   "grade": 10,
   *   "visibility": "DRAFT",
   *   "subjectId": 5,
   *   "description": "Äá» thi giá»¯a ká»³"
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
   *   "title": "Äá» thi ToÃ¡n há»c ká»³ 2",
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

