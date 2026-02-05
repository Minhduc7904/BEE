// src/presentation/controllers/statement.controller.ts
import {
  Controller,
  Post,
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
  CreateStatementDto,
  UpdateStatementDto,
} from '../../application/dtos/statement'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
  CreateStatementUseCase,
  UpdateStatementUseCase,
  DeleteStatementUseCase,
} from '../../application/use-cases/statement'

@Injectable()
@Controller('statements')
export class StatementController {
  constructor(
    private readonly createStatementUseCase: CreateStatementUseCase,
    private readonly updateStatementUseCase: UpdateStatementUseCase,
    private readonly deleteStatementUseCase: DeleteStatementUseCase,
  ) {}

  /**
   * Create a new statement for a question
   *
   * @route POST /statements/question/:questionId
   * @param questionId - Question ID to attach statement to
   * @param dto - Statement data
   * @param adminId - Current admin ID
   * @returns Created statement
   *
   * @example
   * POST /statements/question/123
   * Body: {
   *   "content": "y' = 2x",
   *   "isCorrect": true,
   *   "order": 1
   * }
   */
  @Post('question/:questionId')
  @RequirePermission(PERMISSION_CODES.STATEMENT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createStatement(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: CreateStatementDto,
    @CurrentUser() user: { adminId?: number, userId?: number },
  ): Promise<BaseResponseDto<StatementResponseDto>> {
    return ExceptionHandler.execute(() => this.createStatementUseCase.execute(questionId, dto, user.adminId, user.userId))
  }

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
    @CurrentUser() user: { adminId?: number, userId?: number },
  ): Promise<BaseResponseDto<StatementResponseDto>> {
    return ExceptionHandler.execute(() => this.updateStatementUseCase.execute(id, dto, user.adminId, user.userId))
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
    @CurrentUser() user: { adminId?: number, userId?: number },
  ): Promise<BaseResponseDto<boolean>> {
    return ExceptionHandler.execute(() => this.deleteStatementUseCase.execute(id, user.adminId))
  }
}
