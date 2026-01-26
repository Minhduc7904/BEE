// src/presentation/controllers/homework-submit.controller.ts
import { Controller, Get, Post, Put, Delete, Patch, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { HomeworkSubmitListQueryDto } from '../../application/dtos/homeworkSubmit/homework-submit-list-query.dto'
import { CreateHomeworkSubmitDto } from '../../application/dtos/homeworkSubmit/create-homework-submit.dto'
import { UpdateHomeworkSubmitDto } from '../../application/dtos/homeworkSubmit/update-homework-submit.dto'
import { GradeHomeworkSubmitDto } from '../../application/dtos/homeworkSubmit/grade-homework-submit.dto'
import { HomeworkSubmitListResponseDto, HomeworkSubmitResponseDto } from '../../application/dtos/homeworkSubmit/homework-submit.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
    GetAllHomeworkSubmitUseCase,
    GetHomeworkSubmitByIdUseCase,
    CreateHomeworkSubmitUseCase,
    UpdateHomeworkSubmitUseCase,
    DeleteHomeworkSubmitUseCase,
    GradeHomeworkSubmitUseCase,
} from '../../application/use-cases/homeworkSubmit'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'

@Injectable()
@Controller('homework-submits')
export class HomeworkSubmitController {
    constructor(
        private readonly getAllHomeworkSubmitUseCase: GetAllHomeworkSubmitUseCase,
        private readonly getHomeworkSubmitByIdUseCase: GetHomeworkSubmitByIdUseCase,
        private readonly createHomeworkSubmitUseCase: CreateHomeworkSubmitUseCase,
        private readonly updateHomeworkSubmitUseCase: UpdateHomeworkSubmitUseCase,
        private readonly deleteHomeworkSubmitUseCase: DeleteHomeworkSubmitUseCase,
        private readonly gradeHomeworkSubmitUseCase: GradeHomeworkSubmitUseCase,
    ) { }

    @Get()
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT_GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAllHomeworkSubmits(@Query() query: HomeworkSubmitListQueryDto): Promise<HomeworkSubmitListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllHomeworkSubmitUseCase.execute(query))
    }

    @Get(':id')
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT_GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getHomeworkSubmitById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        return ExceptionHandler.execute(() => this.getHomeworkSubmitByIdUseCase.execute(id))
    }

    @Post()
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT_CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createHomeworkSubmit(
        @Body() dto: CreateHomeworkSubmitDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        return ExceptionHandler.execute(() => this.createHomeworkSubmitUseCase.execute(dto, adminId))
    }

    @Put(':id')
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT_UPDATE)
    @HttpCode(HttpStatus.OK)
    async updateHomeworkSubmit(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateHomeworkSubmitDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        return ExceptionHandler.execute(() => this.updateHomeworkSubmitUseCase.execute(id, dto, adminId))
    }

    @Patch(':id/grade')
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT_GRADE)
    @HttpCode(HttpStatus.OK)
    async gradeHomeworkSubmit(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: GradeHomeworkSubmitDto,
    ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        return ExceptionHandler.execute(() => this.gradeHomeworkSubmitUseCase.execute(id, dto))
    }

    @Delete(':id')
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT_DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteHomeworkSubmit(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteHomeworkSubmitUseCase.execute(id, adminId))
    }
}
