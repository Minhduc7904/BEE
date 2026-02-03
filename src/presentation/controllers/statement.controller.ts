// src/presentation/controllers/statement.controller.ts
import {
  Controller,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import {
  StatementResponseDto,
  UpdateStatementDto,
} from '../../application/dtos/statement'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
  UpdateStatementUseCase,
  DeleteStatementUseCase,
} from '../../application/use-cases/statement'

@Injectable()
@Controller('statements')
export class StatementController {
  constructor(
    private readonly updateStatementUseCase: UpdateStatementUseCase,
    private readonly deleteStatementUseCase: DeleteStatementUseCase,
  ) {}

  /**
   * Update statement
   *
   * @route PUT /statements/:id
   * @param id - Statement ID
   * @param dto - Updated statement data
   * @param adminId - Current admin ID
   * @returns Updated statement
   *
   * @example
   * PUT /statements/123
   * Body: {
   *   "content": "Đáp án A được cập nhật",
   *   "isCorrect": true,
   *   "order": 1
   * }
   */
  @Put(':id')
  @RequirePermission(PERMISSION_CODES.STATEMENT_UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateStatement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatementDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<StatementResponseDto>> {
    return ExceptionHandler.execute(() => this.updateStatementUseCase.execute(id, dto, adminId))
  }

  /**
   * Delete statement
   *
   * @route DELETE /statements/:id
   * @param id - Statement ID
   * @param adminId - Current admin ID
   * @returns Success message
   *
   * @example
   * DELETE /statements/123
   */
  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.STATEMENT_DELETE)
  @HttpCode(HttpStatus.OK)
  async deleteStatement(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<boolean>> {
    return ExceptionHandler.execute(() => this.deleteStatementUseCase.execute(id, adminId))
  }
}
