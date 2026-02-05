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
} from '../../application/dtos/exam'
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
} from '../../application/use-cases/exam'
import { GetQuestionsByExamUseCase } from '../../application/use-cases/question'
import { GetSectionsByExamUseCase } from '../../application/use-cases/section'

@Injectable()
@Controller('exams')
export class ExamController {
  constructor(
    private readonly getAllExamsUseCase: GetAllExamsUseCase,
    private readonly getExamByIdUseCase: GetExamByIdUseCase,
    private readonly createExamUseCase: CreateExamUseCase,
    private readonly updateExamUseCase: UpdateExamUseCase,
    private readonly deleteExamUseCase: DeleteExamUseCase,
    private readonly getQuestionsByExamUseCase: GetQuestionsByExamUseCase,
    private readonly getSectionsByExamUseCase: GetSectionsByExamUseCase,
  ) {}

  /**
   * Get all exams with filters
   *
   * @route GET /exams
   * @param query - Query parameters (page, limit, subjectId, grade, visibility, etc.)
   * @returns Paginated list of exams
   *
   * @example
   * GET /exams?page=1&limit=10&subjectId=5&grade=10
   */
  @Get()
  @RequirePermission(PERMISSION_CODES.EXAM_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllExams(@Query() query: ExamListQueryDto): Promise<ExamListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllExamsUseCase.execute(query))
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
  @RequirePermission(PERMISSION_CODES.EXAM_GET_BY_ID)
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
  @RequirePermission(PERMISSION_CODES.EXAM_CREATE)
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
  @RequirePermission(PERMISSION_CODES.EXAM_UPDATE)
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
  @RequirePermission(PERMISSION_CODES.EXAM_DELETE)
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
  @RequirePermission(PERMISSION_CODES.QUESTION_GET_ALL)
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
  @RequirePermission(PERMISSION_CODES.SECTION_GET_BY_EXAM)
  @HttpCode(HttpStatus.OK)
  async getSectionsByExam(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<SectionResponseDto[]>> {
    return ExceptionHandler.execute(() => this.getSectionsByExamUseCase.execute(id))
  }
}
