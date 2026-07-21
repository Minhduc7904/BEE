import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common'

import {
  BackgroundJobLockListQueryDto,
  BackgroundJobLockResponseDto,
  PaginationResponseDto,
} from '../../application/dtos'
import { GetBackgroundJobLocksUseCase } from '../../application/use-cases/background-job'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('admin/background-job-locks')
export class BackgroundJobLockController {
  constructor(private readonly getBackgroundJobLocksUseCase: GetBackgroundJobLocksUseCase) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.BACKGROUND_JOB.GET_LOCKS)
  @HttpCode(HttpStatus.OK)
  async getBackgroundJobLocks(
    @Query() query: BackgroundJobLockListQueryDto,
  ): Promise<PaginationResponseDto<BackgroundJobLockResponseDto>> {
    return ExceptionHandler.execute(() => this.getBackgroundJobLocksUseCase.execute(query))
  }
}
