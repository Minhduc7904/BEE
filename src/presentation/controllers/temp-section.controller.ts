// src/presentation/controllers/temp-section.controller.ts
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
    CreateTempSectionDto,
    UpdateTempSectionDto,
    TempSectionResponseDto,
    ReorderTempSectionsDto,
} from '../../application/dtos/temp-section'
import {
    GetTempSectionsByExamUseCase,
    GetTempSectionByIdUseCase,
    CreateTempSectionUseCase,
    UpdateTempSectionUseCase,
    DeleteTempSectionUseCase,
    ReorderTempSectionsUseCase,
} from '../../application/use-cases/temp-section'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Controller('temp-sections')
export class TempSectionController {
    constructor(
        private readonly getTempSectionsByExamUseCase: GetTempSectionsByExamUseCase,
        private readonly getTempSectionByIdUseCase: GetTempSectionByIdUseCase,
        private readonly createTempSectionUseCase: CreateTempSectionUseCase,
        private readonly updateTempSectionUseCase: UpdateTempSectionUseCase,
        private readonly deleteTempSectionUseCase: DeleteTempSectionUseCase,
        private readonly reorderTempSectionsUseCase: ReorderTempSectionsUseCase,
    ) { }

    /**
     * Lấy danh sách TempSection theo sessionId
     * GET /temp-sections/session/:sessionId
     */
    @Get('session/:sessionId')
    @RequirePermission(PERMISSION_CODES.TEMP_SECTION_GET_BY_EXAM)
    @HttpCode(HttpStatus.OK)
    async getTempSectionsBySession(
        @Param('sessionId') sessionId: number,
    ): Promise<BaseResponseDto<TempSectionResponseDto[]>> {
        return ExceptionHandler.execute(() =>
            this.getTempSectionsByExamUseCase.execute(sessionId),
        )
    }

    /**
     * Lấy TempSection theo ID
     * GET /temp-sections/:tempSectionId
     */
    @Get(':tempSectionId')
    @RequirePermission(PERMISSION_CODES.TEMP_SECTION_GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getTempSectionById(
        @Param('tempSectionId') tempSectionId: number,
    ): Promise<BaseResponseDto<TempSectionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getTempSectionByIdUseCase.execute(tempSectionId),
        )
    }

    /**
     * Tạo TempSection cho session
     * POST /temp-sections/session/:sessionId
     */
    @Post('session/:sessionId')
    @RequirePermission(PERMISSION_CODES.TEMP_SECTION_CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createTempSection(
        @Param('sessionId') sessionId: number,
        @Body() dto: CreateTempSectionDto,
    ): Promise<BaseResponseDto<TempSectionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.createTempSectionUseCase.execute(sessionId, dto),
        )
    }

    /**
     * Cập nhật TempSection
     * PUT /temp-sections/:tempSectionId
     */
    @Put(':tempSectionId')
    @RequirePermission(PERMISSION_CODES.TEMP_SECTION_UPDATE)
    @HttpCode(HttpStatus.OK)
    async updateTempSection(
        @Param('tempSectionId') tempSectionId: number,
        @Body() dto: UpdateTempSectionDto,
    ): Promise<BaseResponseDto<TempSectionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.updateTempSectionUseCase.execute(tempSectionId, dto),
        )
    }

    /**
     * Xóa TempSection
     * DELETE /temp-sections/:tempSectionId
     */
    @Delete(':tempSectionId')
    @RequirePermission(PERMISSION_CODES.TEMP_SECTION_DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteTempSection(
        @Param('tempSectionId') tempSectionId: number,
    ): Promise<BaseResponseDto<boolean>> {
        return ExceptionHandler.execute(() =>
            this.deleteTempSectionUseCase.execute(tempSectionId),
        )
    }

    /**
     * Cập nhật lại order cho nhiều TempSection
     * PUT /temp-sections/reorder
     */
    @Put('reorder')
    @RequirePermission(PERMISSION_CODES.TEMP_SECTION_UPDATE)
    @HttpCode(HttpStatus.OK)
    async reorderTempSections(
        @Body() dto: ReorderTempSectionsDto,
    ): Promise<BaseResponseDto<boolean>> {
        return ExceptionHandler.execute(() =>
            this.reorderTempSectionsUseCase.execute(dto),
        )
    }
}
