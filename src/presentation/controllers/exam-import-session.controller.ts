// src/presentation/controllers/exam-import-session.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ExamImportSessionListQueryDto,
  ExamImportSessionListResponseDto,
  ExamImportSessionResponseDto,
  UpdateExamImportSessionRawContentDto,
} from '../../application/dtos/exam-import-session'
import {
  GetAllExamImportSessionsUseCase,
  CreateExamImportSessionUseCase,
  GetExamImportSessionByIdUseCase,
  GetExamImportSessionRawContentUseCase,
  UpdateExamImportSessionRawContentUseCase,
  SplitExamFromSessionUseCase,
  SplitExamFromRawContentUseCase,
  ClassifyQuestionChaptersUseCase,
  MigrateTempToFinalExamUseCase,
} from '../../application/use-cases/exam-import-session'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { CurrentUser } from '../../shared/decorators'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { MediaRawContentResponseDto } from '../../application/dtos/media/media-raw-content-response.dto'
import { DefaultValuePipe, ParseIntPipe } from '@nestjs/common'
import {
  SplitExamFromRawContentDto,
  SplitExamResponseDto,
} from '../../application/dtos/exam-import-session'
import { ClassifyQuestionChaptersResponseDto } from '../../application/use-cases/exam-import-session/classify-question-chapters.use-case'
@Controller('exam-import-sessions')
export class ExamImportSessionController {
  constructor(
    private readonly getAllExamImportSessionsUseCase: GetAllExamImportSessionsUseCase,
    private readonly splitExamFromSessionUseCase: SplitExamFromSessionUseCase,
    private readonly splitExamFromRawContentUseCase: SplitExamFromRawContentUseCase,
    private readonly getExamImportSessionRawContentUseCase: GetExamImportSessionRawContentUseCase,
    private readonly updateExamImportSessionRawContentUseCase: UpdateExamImportSessionRawContentUseCase,
    private readonly createExamImportSessionUseCase: CreateExamImportSessionUseCase,
    private readonly getExamImportSessionByIdUseCase: GetExamImportSessionByIdUseCase,
    private readonly classifyQuestionChaptersUseCase: ClassifyQuestionChaptersUseCase,
    private readonly migrateTempToFinalExamUseCase: MigrateTempToFinalExamUseCase,
  ) { }

  @Get()
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllSessions(
    @Query() query: ExamImportSessionListQueryDto,
  ): Promise<ExamImportSessionListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllExamImportSessionsUseCase.execute(query))
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<ExamImportSessionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.createExamImportSessionUseCase.execute(adminId),
    )
  }

  @Get(':sessionId')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getSessionById(
    @Param('sessionId') sessionId: number,
  ): Promise<BaseResponseDto<ExamImportSessionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getExamImportSessionByIdUseCase.execute(sessionId),
    )
  }

  /**
   * Get raw content with presigned URLs for exam import session
   * Can only view raw content of sessions created by self
   */
  @Get(':sessionId/raw-content/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getSessionRawContent(
    @Param('sessionId') sessionId: number,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<MediaRawContentResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getExamImportSessionRawContentUseCase.execute(sessionId, adminId, expirySeconds),
    )
  }

  /**
   * Update raw content for exam import session
   * Can only update sessions created by self
   * Automatically cleans up unused media
   */
  @Put(':sessionId/raw-content/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async updateSessionRawContent(
    @Param('sessionId') sessionId: number,
    @Body() dto: UpdateExamImportSessionRawContentDto,
    @CurrentUser() user: { adminId: number; userId: number },
  ): Promise<BaseResponseDto<{ rawContent: string; deletedMediaCount: number }>> {
    return ExceptionHandler.execute(() =>
      this.updateExamImportSessionRawContentUseCase.execute(sessionId, user.adminId, dto.rawContent, user.userId),
    )
  }

  /**
  * Tách câu hỏi từ rawContent của session
  * Lấy rawContent từ database và sử dụng AI để tách câu hỏi
  * Chỉ người tạo session mới được sử dụng
  */
  @Post(':sessionId/split-questions/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async splitExamFromSession(
    @Param('sessionId') sessionId: number,
    @CurrentUser() user: { adminId: number; userId: number },
  ): Promise<BaseResponseDto<SplitExamResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.splitExamFromSessionUseCase.execute(sessionId, user.adminId, user.userId),
    )
  }

  /**
   * Tách câu hỏi từ rawContent do người dùng truyền vào
   * Lưu kết quả vào session hiện tại (không tạo session mới)
   * Chỉ người tạo session mới được sử dụng
   */
  @Post(':sessionId/split-question/raw-content')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async splitExamFromRawContent(
    @Param('sessionId') sessionId: number,
    @Body() dto: SplitExamFromRawContentDto,
    @CurrentUser() user: { adminId: number; userId: number },
  ): Promise<BaseResponseDto<SplitExamResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.splitExamFromRawContentUseCase.execute(sessionId, dto.rawContent, user.adminId, user.userId),
    )
  }

  /**
   * Phân loại chapters cho các câu hỏi của session
   * Sử dụng AI để phân loại và lưu kết quả vào TempQuestionChapter
   * Chỉ người tạo session mới được sử dụng
   */
  @Post(':sessionId/classify-chapters/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async classifyQuestionChapters(
    @Param('sessionId') sessionId: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<ClassifyQuestionChaptersResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.classifyQuestionChaptersUseCase.execute(sessionId, adminId),
    )
  }

  /**
   * Migrate temp exam data to final exam tables
   * Tạo Exam, Sections, Questions, Statements từ temp tables
   * Chỉ người tạo session mới được sử dụng
   */
  @Post(':sessionId/migrate/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async migrateTempToFinalExam(
    @Param('sessionId') sessionId: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{
    examId: number
    totalSections: number
    totalQuestions: number
    totalStatements: number
    totalChapters: number
  }>> {
    return ExceptionHandler.execute(() =>
      this.migrateTempToFinalExamUseCase.execute({ sessionId, adminId }),
    )
  }
}
