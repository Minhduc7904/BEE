// src/presentation/controllers/question.controller.ts
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
  QuestionResponseDto,
  QuestionListResponseDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionListQueryDto,
} from '../../application/dtos/question'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
  GetAllQuestionsUseCase,
  GetQuestionByIdUseCase,
  CreateQuestionUseCase,
  UpdateQuestionUseCase,
  DeleteQuestionUseCase,
} from '../../application/use-cases/question'

@Injectable()
@Controller('questions')
export class QuestionController {
  constructor(
    private readonly getAllQuestionsUseCase: GetAllQuestionsUseCase,
    private readonly getQuestionByIdUseCase: GetQuestionByIdUseCase,
    private readonly createQuestionUseCase: CreateQuestionUseCase,
    private readonly updateQuestionUseCase: UpdateQuestionUseCase,
    private readonly deleteQuestionUseCase: DeleteQuestionUseCase,
  ) {}

  /**
   * Get all questions with filters
   *
   * @route GET /questions
   * @param query - Query parameters (page, limit, subjectId, type, difficulty, grade, etc.)
   * @returns Paginated list of questions
   *
   * @example
   * GET /questions?page=1&limit=10&subjectId=5&grade=10
   */
  @Get()
  @RequirePermission(PERMISSION_CODES.QUESTION_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllQuestions(@Query() query: QuestionListQueryDto): Promise<QuestionListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllQuestionsUseCase.execute(query))
  }

  /**
   * Get question by ID
   *
   * @route GET /questions/:id
   * @param id - Question ID
   * @returns Question details with presigned URLs for media
   *
   * @example
   * GET /questions/123
   */
  @Get(':id')
  @RequirePermission(PERMISSION_CODES.QUESTION_GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getQuestionById(@Param('id', ParseIntPipe) id: number): Promise<BaseResponseDto<QuestionResponseDto>> {
    return ExceptionHandler.execute(() => this.getQuestionByIdUseCase.execute(id))
  }

  /**
   * Create new question
   *
   * @route POST /questions
   * @param dto - Question data
   * @param adminId - Current admin ID
   * @returns Created question
   *
   * @example
   * POST /questions
   * Body: {
   *   "content": "Tính đạo hàm của y = x^2",
   *   "type": "SINGLE_CHOICE",
   *   "difficulty": "VD",
   *   "grade": 10,
   *   "subjectId": 5,
   *   "chapterIds": [1, 2]
   * }
   */
  @Post()
  @RequirePermission(PERMISSION_CODES.QUESTION_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createQuestion(
    @Body() dto: CreateQuestionDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<QuestionResponseDto>> {
    return ExceptionHandler.execute(() => this.createQuestionUseCase.execute(dto, adminId))
  }

  /**
   * Update question
   *
   * @route PUT /questions/:id
   * @param id - Question ID
   * @param dto - Updated question data
   * @param adminId - Current admin ID
   * @returns Updated question
   *
   * @example
   * PUT /questions/123
   * Body: {
   *   "content": "Tính đạo hàm của y = x^3",
   *   "difficulty": "VDC",
   *   "correctAnswer": "3x^2"
   * }
   */
  @Put(':id')
  @RequirePermission(PERMISSION_CODES.QUESTION_UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<QuestionResponseDto>> {
    return ExceptionHandler.execute(() => this.updateQuestionUseCase.execute(id, dto, adminId))
  }

  /**
   * Delete question
   *
   * @route DELETE /questions/:id
   * @param adminId - Current admin ID
   * @returns Success message
   *
   * @example
   * DELETE /questions/123
   */
  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.QUESTION_DELETE)
  @HttpCode(HttpStatus.OK)
  async deleteQuestion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<boolean>> {
    return ExceptionHandler.execute(() => this.deleteQuestionUseCase.execute(id, adminId))
  }
}