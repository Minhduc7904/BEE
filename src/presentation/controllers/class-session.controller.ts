// src/presentation/controllers/class-session.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Query,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
    UseInterceptors,
} from '@nestjs/common'
import { ClassSessionListQueryDto } from '../../application/dtos/class-session/class-session-list-query.dto'
import { CreateClassSessionDto } from '../../application/dtos/class-session/create-class-session.dto'
import { UpdateClassSessionDto } from '../../application/dtos/class-session/update-class-session.dto'
import {
    ClassSessionListResponseDto,
    ClassSessionResponseDto,
} from '../../application/dtos/class-session/class-session.dto'
import { ClassSessionSearchQueryDto } from '../../application/dtos/class-session/class-session-search-query.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
    GetAllClassSessionUseCase,
    GetClassSessionByIdUseCase,
    CreateClassSessionUseCase,
    UpdateClassSessionUseCase,
    DeleteClassSessionUseCase,
} from '../../application/use-cases/class-session'
import { Injectable } from '@nestjs/common'

@Injectable()
@Controller('class-sessions')
export class ClassSessionController {
    constructor(
        private readonly getAllClassSessionUseCase: GetAllClassSessionUseCase,
        private readonly getClassSessionByIdUseCase: GetClassSessionByIdUseCase,
        private readonly createClassSessionUseCase: CreateClassSessionUseCase,
        private readonly updateClassSessionUseCase: UpdateClassSessionUseCase,
        private readonly deleteClassSessionUseCase: DeleteClassSessionUseCase,
    ) { }

    /**
     * Get all class sessions with pagination and filters
     * GET /class-sessions
     * Query params:
     * - page: số trang (default: 1)
     * - limit: số lượng mỗi trang (default: 10, max: 100)
     * - search: tìm kiếm theo sessionId
     * - classId: lọc theo ID lớp học
     * - sessionDateFrom: lọc theo ngày bắt đầu (ISO 8601)
     * - sessionDateTo: lọc theo ngày kết thúc (ISO 8601)
     * - isPast: lọc các buổi học đã diễn ra
     * - isToday: lọc các buổi học diễn ra trong ngày hôm nay
     * - isUpcoming: lọc các buổi học sắp diễn ra
     * - sortBy: trường sắp xếp (default: createdAt)
     * - sortOrder: asc hoặc desc (default: desc)
     */
    @Get()
    @RequirePermission(PERMISSION_CODES.CLASS_SESSION_GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAll(
        @Query() query: ClassSessionListQueryDto,
    ): Promise<ClassSessionListResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getAllClassSessionUseCase.execute(query)
        )
    }

    @Get('search')
    @RequirePermission(PERMISSION_CODES.CLASS_SESSION_SEARCH)
    @HttpCode(HttpStatus.OK)
    async searchClassSessions(
        @Query() query: ClassSessionSearchQueryDto,
    ): Promise<ClassSessionListResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getAllClassSessionUseCase.execute(query)
        )
    }

    @Get(':id')
    @RequirePermission(PERMISSION_CODES.CLASS_SESSION_GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<ClassSessionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getClassSessionByIdUseCase.execute(id)
        )
    }

    @Post()
    @RequirePermission(PERMISSION_CODES.CLASS_SESSION_CREATE)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateClassSessionDto,
        @CurrentUser('adminId') adminId?: number,
    ): Promise<BaseResponseDto<ClassSessionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.createClassSessionUseCase.execute(dto, adminId)
        )
    }

    @Put(':id')
    @RequirePermission(PERMISSION_CODES.CLASS_SESSION_UPDATE)
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateClassSessionDto,
        @CurrentUser('adminId') adminId?: number,
    ): Promise<BaseResponseDto<ClassSessionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.updateClassSessionUseCase.execute(id, dto, adminId)
        )
    }

    @Delete(':id')
    @RequirePermission(PERMISSION_CODES.CLASS_SESSION_DELETE)
    @HttpCode(HttpStatus.OK)
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('adminId') adminId?: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() =>
            this.deleteClassSessionUseCase.execute(id, adminId)
        )
    }
}
