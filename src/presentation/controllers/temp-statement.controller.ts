// src/presentation/controllers/temp-statement.controller.ts
import {
    Controller,
    Post,
    Put,
    Delete,
    Param,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common'
import {
    CreateTempStatementDto,
    UpdateTempStatementDto,
    TempStatementResponseDto,
    ReorderTempStatementsDto,
} from '../../application/dtos/temp-statement'
import {
    CreateTempStatementUseCase,
    UpdateTempStatementUseCase,
    DeleteTempStatementUseCase,
    ReorderTempStatementsUseCase,
} from '../../application/use-cases/temp-statement'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from 'src/shared/decorators'

@Controller('temp-statements')
export class TempStatementController {
    constructor(
        private readonly createTempStatementUseCase: CreateTempStatementUseCase,
        private readonly updateTempStatementUseCase: UpdateTempStatementUseCase,
        private readonly deleteTempStatementUseCase: DeleteTempStatementUseCase,
        private readonly reorderTempStatementsUseCase: ReorderTempStatementsUseCase,
    ) { }

    /**
     * Tạo TempStatement cho TempQuestion
     * POST /temp-statements/question/:tempQuestionId
     */
    @Post('question/:tempQuestionId')
    @RequirePermission(PERMISSION_CODES.TEMP_STATEMENT.CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createTempStatement(
        @Param('tempQuestionId') tempQuestionId: number,
        @Body() dto: CreateTempStatementDto,
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<TempStatementResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.createTempStatementUseCase.execute(tempQuestionId, dto, userId),
        )
    }

    /**
     * Cập nhật lại order cho nhiều TempStatement
     * PUT /temp-statements/reorder
     */
    @Put('reorder')
    @RequirePermission(PERMISSION_CODES.TEMP_STATEMENT.UPDATE)
    @HttpCode(HttpStatus.OK)
    async reorderTempStatements(
        @Body() dto: ReorderTempStatementsDto,
    ): Promise<BaseResponseDto<boolean>> {
        return ExceptionHandler.execute(() =>
            this.reorderTempStatementsUseCase.execute(dto),
        )
    }

    /**
     * Cập nhật TempStatement
     * PUT /temp-statements/:tempStatementId
     */
    @Put(':tempStatementId')
    @RequirePermission(PERMISSION_CODES.TEMP_STATEMENT.UPDATE)
    @HttpCode(HttpStatus.OK)
    async updateTempStatement(
        @Param('tempStatementId') tempStatementId: number,
        @Body() dto: UpdateTempStatementDto,
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<TempStatementResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.updateTempStatementUseCase.execute(tempStatementId, dto, userId),
        )
    }

    /**
     * Xóa TempStatement
     * DELETE /temp-statements/:tempStatementId
     */
    @Delete(':tempStatementId')
    @RequirePermission(PERMISSION_CODES.TEMP_STATEMENT.DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteTempStatement(
        @Param('tempStatementId') tempStatementId: number,
    ): Promise<BaseResponseDto<boolean>> {
        return ExceptionHandler.execute(() =>
            this.deleteTempStatementUseCase.execute(tempStatementId),
        )
    }
}
