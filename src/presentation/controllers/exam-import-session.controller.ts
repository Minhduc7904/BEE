// src/presentation/controllers/exam-import-session.controller.ts
import {
  Controller,
  Get,
  Post,
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
  CreateExamImportSessionDto,
} from '../../application/dtos/exam-import-session'
import {
  GetAllExamImportSessionsUseCase,
  CreateExamImportSessionUseCase,
  GetExamImportSessionByIdUseCase,
} from '../../application/use-cases/exam-import-session'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { CurrentUser } from '../../shared/decorators'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Controller('exam-import-sessions')
export class ExamImportSessionController {
  constructor(
    private readonly getAllExamImportSessionsUseCase: GetAllExamImportSessionsUseCase,
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
    @Body() dto: CreateExamImportSessionDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<ExamImportSessionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.createExamImportSessionUseCase.execute(dto, adminId),
    )
  }

  @Get(':sessionId')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION_GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getSessionById(
    @Param('sessionId') sessionId: string,
  ): Promise<BaseResponseDto<ExamImportSessionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getExamImportSessionByIdUseCase.execute(sessionId),
    )
  }
}
