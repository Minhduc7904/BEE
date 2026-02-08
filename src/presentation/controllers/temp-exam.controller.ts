// src/presentation/controllers/temp-exam.controller.ts
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
  CreateTempExamDto,
  UpdateTempExamDto,
  TempExamResponseDto,
} from '../../application/dtos/temp-exam'
import {
  GetTempExamBySessionUseCase,
  CreateTempExamUseCase,
  UpdateTempExamUseCase,
} from '../../application/use-cases/temp-exam'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Controller('temp-exams')
export class TempExamController {
  constructor(
    private readonly getTempExamBySessionUseCase: GetTempExamBySessionUseCase,
    private readonly createTempExamUseCase: CreateTempExamUseCase,
    private readonly updateTempExamUseCase: UpdateTempExamUseCase,
  ) {}

  /**
   * Lấy TempExam theo sessionId
   * GET /temp-exams/session/:sessionId
   */
  @Get('session/:sessionId')
  @RequirePermission(PERMISSION_CODES.TEMP_EXAM.GET_BY_SESSION)
  @HttpCode(HttpStatus.OK)
  async getTempExamBySession(
    @Param('sessionId') sessionId: number,
  ): Promise<BaseResponseDto<TempExamResponseDto | null>> {
    return ExceptionHandler.execute(() =>
      this.getTempExamBySessionUseCase.execute(sessionId),
    )
  }

  /**
   * Tạo TempExam cho session
   * POST /temp-exams/session/:sessionId
   */
  @Post('session/:sessionId')
  @RequirePermission(PERMISSION_CODES.TEMP_EXAM.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createTempExam(
    @Param('sessionId') sessionId: number,
    @Body() dto: CreateTempExamDto,
  ): Promise<BaseResponseDto<TempExamResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.createTempExamUseCase.execute(sessionId, dto),
    )
  }

  /**
   * Cập nhật TempExam
   * PUT /temp-exams/:tempExamId
   */
  @Put(':tempExamId')
  @RequirePermission(PERMISSION_CODES.TEMP_EXAM.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateTempExam(
    @Param('tempExamId') tempExamId: number,
    @Body() dto: UpdateTempExamDto,
  ): Promise<BaseResponseDto<TempExamResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.updateTempExamUseCase.execute(tempExamId, dto),
    )
  }
}
