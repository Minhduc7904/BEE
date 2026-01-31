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
} from '../../application/use-cases/exam-import-session'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { CurrentUser } from '../../shared/decorators'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { MediaRawContentResponseDto } from '../../application/dtos/media/media-raw-content-response.dto'
import { DefaultValuePipe, ParseIntPipe } from '@nestjs/common'

@Controller('exam-import-sessions')
export class ExamImportSessionController {
  constructor(
    private readonly getAllExamImportSessionsUseCase: GetAllExamImportSessionsUseCase,
    private readonly getExamImportSessionRawContentUseCase: GetExamImportSessionRawContentUseCase,
    private readonly updateExamImportSessionRawContentUseCase: UpdateExamImportSessionRawContentUseCase,
    private readonly createExamImportSessionUseCase: CreateExamImportSessionUseCase,
    private readonly getExamImportSessionByIdUseCase: GetExamImportSessionByIdUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllSessions(
    @Query() query: ExamImportSessionListQueryDto,
  ): Promise<ExamImportSessionListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllExamImportSessionsUseCase.execute(query))
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<ExamImportSessionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.createExamImportSessionUseCase.execute(adminId),
    )
  }

  @Get(':sessionId')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION_GET_BY_ID)
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
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION_GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getSessionRawContent(
    @Param('sessionId') sessionId: number,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<MediaRawContentResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getExamImportSessionRawContentUseCase.execute(sessionId, userId, expirySeconds),
    )
  }

  /**
   * Update raw content for exam import session
   * Can only update sessions created by self
   * Automatically cleans up unused media
   */
  @Put(':sessionId/raw-content/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION_GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async updateSessionRawContent(
    @Param('sessionId') sessionId: number,
    @Body() dto: UpdateExamImportSessionRawContentDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<{ rawContent: string; deletedMediaCount: number }>> {
    return ExceptionHandler.execute(() =>
      this.updateExamImportSessionRawContentUseCase.execute(sessionId, userId, dto.rawContent),
    )
  }
}
