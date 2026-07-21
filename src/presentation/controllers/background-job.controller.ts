import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Put, Query } from '@nestjs/common'

import {
  BackgroundJobListQueryDto,
  BackgroundJobResponseDto,
  BaseResponseDto,
  PaginationResponseDto,
  UpdateBackgroundJobDto,
} from '../../application/dtos'
import {
  GetBackgroundJobByIdUseCase,
  GetBackgroundJobsUseCase,
  UpdateBackgroundJobUseCase,
} from '../../application/use-cases/background-job'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('admin/background-jobs')
export class BackgroundJobController {
  constructor(
    private readonly getBackgroundJobsUseCase: GetBackgroundJobsUseCase,
    private readonly getBackgroundJobByIdUseCase: GetBackgroundJobByIdUseCase,
    private readonly updateBackgroundJobUseCase: UpdateBackgroundJobUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.BACKGROUND_JOB.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getBackgroundJobs(
    @Query() query: BackgroundJobListQueryDto,
  ): Promise<PaginationResponseDto<BackgroundJobResponseDto>> {
    return ExceptionHandler.execute(() => this.getBackgroundJobsUseCase.execute(query))
  }

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.BACKGROUND_JOB.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getBackgroundJobById(
    @Param('id', ParseIntPipe) backgroundJobId: number,
  ): Promise<BaseResponseDto<BackgroundJobResponseDto>> {
    return ExceptionHandler.execute(() => this.getBackgroundJobByIdUseCase.execute(backgroundJobId))
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.BACKGROUND_JOB.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateBackgroundJob(
    @Param('id', ParseIntPipe) backgroundJobId: number,
    @Body() dto: UpdateBackgroundJobDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<BackgroundJobResponseDto>> {
    return ExceptionHandler.execute(() => this.updateBackgroundJobUseCase.execute(backgroundJobId, dto, adminId))
  }
}
