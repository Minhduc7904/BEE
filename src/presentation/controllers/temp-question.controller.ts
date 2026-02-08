// src/presentation/controllers/temp-question.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common'
import {
    CreateTempQuestionDto,
    UpdateTempQuestionDto,
    TempQuestionResponseDto,
    ReorderTempQuestionsDto,
    LinkQuestionToSectionDto,
} from '../../application/dtos/temp-question'
import {
    GetTempQuestionsBySessionUseCase,
    GetTempQuestionByIdUseCase,
    CreateTempQuestionUseCase,
    UpdateTempQuestionUseCase,
    DeleteTempQuestionUseCase,
    ReorderTempQuestionsUseCase,
    LinkQuestionToSectionUseCase,
} from '../../application/use-cases/temp-question'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from 'src/shared/decorators'

@Controller('temp-questions')
export class TempQuestionController {
    constructor(
        private readonly getTempQuestionsBySessionUseCase: GetTempQuestionsBySessionUseCase,
        private readonly getTempQuestionByIdUseCase: GetTempQuestionByIdUseCase,
        private readonly createTempQuestionUseCase: CreateTempQuestionUseCase,
        private readonly updateTempQuestionUseCase: UpdateTempQuestionUseCase,
        private readonly deleteTempQuestionUseCase: DeleteTempQuestionUseCase,
        private readonly reorderTempQuestionsUseCase: ReorderTempQuestionsUseCase,
        private readonly linkQuestionToSectionUseCase: LinkQuestionToSectionUseCase,
    ) { }

    /**
     * Lấy danh sách TempQuestion theo sessionId
     * GET /temp-questions/session/:sessionId
     */
    @Get('session/:sessionId')
    @RequirePermission(PERMISSION_CODES.TEMP_QUESTION.GET_BY_SESSION)
    @HttpCode(HttpStatus.OK)
    async getTempQuestionsBySession(
        @Param('sessionId') sessionId: number,
    ): Promise<BaseResponseDto<TempQuestionResponseDto[]>> {
        return ExceptionHandler.execute(() =>
            this.getTempQuestionsBySessionUseCase.execute(sessionId),
        )
    }

    @Get(':tempQuestionId')
    @RequirePermission(PERMISSION_CODES.TEMP_QUESTION.GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getTempQuestionById(
        @Param('tempQuestionId') tempQuestionId: number,
    ): Promise<BaseResponseDto<TempQuestionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getTempQuestionByIdUseCase.execute(tempQuestionId),
        )
    }

    /**
     * Tạo TempQuestion cho session
     * POST /temp-questions/session/:sessionId
     */
    @Post('session/:sessionId')
    @RequirePermission(PERMISSION_CODES.TEMP_QUESTION.CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createTempQuestion(
        @Param('sessionId') sessionId: number,
        @Body() dto: CreateTempQuestionDto,
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<TempQuestionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.createTempQuestionUseCase.execute(sessionId, dto, userId),
        )
    }

    /**
     * Cập nhật lại order cho nhiều TempQuestion
     * PUT /temp-questions/reorder
     */
    @Put('reorder')
    @RequirePermission(PERMISSION_CODES.TEMP_QUESTION.UPDATE)
    @HttpCode(HttpStatus.OK)
    async reorderTempQuestions(
        @Body() dto: ReorderTempQuestionsDto,
    ): Promise<BaseResponseDto<boolean>> {
        return ExceptionHandler.execute(() =>
            this.reorderTempQuestionsUseCase.execute(dto),
        )
    }

    /**
     * Cập nhật TempQuestion
     * PUT /temp-questions/:tempQuestionId
     */
    @Put(':tempQuestionId')
    @RequirePermission(PERMISSION_CODES.TEMP_QUESTION.UPDATE)
    @HttpCode(HttpStatus.OK)
    async updateTempQuestion(
        @Param('tempQuestionId') tempQuestionId: number,
        @Body() dto: UpdateTempQuestionDto,
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<TempQuestionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.updateTempQuestionUseCase.execute(tempQuestionId, dto, userId),
        )
    }

    /**
     * Xóa TempQuestion
     * DELETE /temp-questions/:tempQuestionId
     */
    @Delete(':tempQuestionId')
    @RequirePermission(PERMISSION_CODES.TEMP_QUESTION.DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteTempQuestion(
        @Param('tempQuestionId') tempQuestionId: number,
    ): Promise<BaseResponseDto<boolean>> {
        return ExceptionHandler.execute(() =>
            this.deleteTempQuestionUseCase.execute(tempQuestionId),
        )
    }



    /**
     * Gắn/Gỡ câu hỏi vào/khỏi section
     * PUT /temp-questions/:tempQuestionId/link-section
     */
    @Put(':tempQuestionId/link-section')
    @RequirePermission(PERMISSION_CODES.TEMP_QUESTION.UPDATE)
    @HttpCode(HttpStatus.OK)
    async linkQuestionToSection(
        @Param('tempQuestionId') tempQuestionId: number,
        @Body() dto: LinkQuestionToSectionDto,
    ): Promise<BaseResponseDto<TempQuestionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.linkQuestionToSectionUseCase.execute(tempQuestionId, dto),
        )
    }
}
