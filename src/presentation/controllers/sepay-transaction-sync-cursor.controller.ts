import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, Query } from '@nestjs/common'

import {
  BaseResponseDto,
  PaginationResponseDto,
  SepayTransactionSyncCursorListQueryDto,
  SepayTransactionSyncCursorResponseDto,
  UpdateSepayTransactionSyncCursorDto,
} from '../../application/dtos'
import {
  GetSepayTransactionSyncCursorsUseCase,
  UpdateSepayTransactionSyncCursorUseCase,
} from '../../application/use-cases/background-job'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('admin/sepay-transaction-sync-cursors')
export class SepayTransactionSyncCursorController {
  constructor(
    private readonly getSepayTransactionSyncCursorsUseCase: GetSepayTransactionSyncCursorsUseCase,
    private readonly updateSepayTransactionSyncCursorUseCase: UpdateSepayTransactionSyncCursorUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.BACKGROUND_JOB.GET_SEPAY_SYNC_CURSORS)
  @HttpCode(HttpStatus.OK)
  async getSepayTransactionSyncCursors(
    @Query() query: SepayTransactionSyncCursorListQueryDto,
  ): Promise<PaginationResponseDto<SepayTransactionSyncCursorResponseDto>> {
    return ExceptionHandler.execute(() => this.getSepayTransactionSyncCursorsUseCase.execute(query))
  }

  @Put(':scope')
  @RequirePermission(PERMISSION_CODES.BACKGROUND_JOB.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateSepayTransactionSyncCursor(
    @Param('scope') scope: string,
    @Body() dto: UpdateSepayTransactionSyncCursorDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<SepayTransactionSyncCursorResponseDto>> {
    return ExceptionHandler.execute(() => this.updateSepayTransactionSyncCursorUseCase.execute(scope, dto, adminId))
  }
}
