import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common'

import {
  BackgroundJobRunListQueryDto,
  BackgroundJobRunResponseDto,
  BaseResponseDto,
  PaginationResponseDto,
} from '../../application/dtos'
import { GetBackgroundJobRunByIdUseCase, GetBackgroundJobRunsUseCase } from '../../application/use-cases/background-job'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('admin/background-job-runs')
export class BackgroundJobRunController {
  constructor(
    private readonly getBackgroundJobRunsUseCase: GetBackgroundJobRunsUseCase,
    private readonly getBackgroundJobRunByIdUseCase: GetBackgroundJobRunByIdUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.BACKGROUND_JOB.GET_RUNS)
  @HttpCode(HttpStatus.OK)
  async getBackgroundJobRuns(
    @Query() query: BackgroundJobRunListQueryDto,
  ): Promise<PaginationResponseDto<BackgroundJobRunResponseDto>> {
    return ExceptionHandler.execute(() => this.getBackgroundJobRunsUseCase.execute(query))
  }

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.BACKGROUND_JOB.GET_RUN_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getBackgroundJobRunById(
    @Param('id', ParseIntPipe) backgroundJobRunId: number,
  ): Promise<BaseResponseDto<BackgroundJobRunResponseDto>> {
    return ExceptionHandler.execute(() => this.getBackgroundJobRunByIdUseCase.execute(backgroundJobRunId))
  }
}
