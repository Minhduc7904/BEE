// src/presentation/controllers/lesson.controller.ts
import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { LessonListQueryDto } from '../../application/dtos/lesson/lesson-list-query.dto'
import { CreateLessonDto } from '../../application/dtos/lesson/create-lesson.dto'
import { UpdateLessonDto } from '../../application/dtos/lesson/update-lesson.dto'
import { LessonListResponseDto, LessonResponseDto } from '../../application/dtos/lesson/lesson.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
    GetAllLessonUseCase,
    GetLessonByIdUseCase,
    CreateLessonUseCase,
    UpdateLessonUseCase,
    DeleteLessonUseCase,
} from '../../application/use-cases/lesson'
import { Injectable } from '@nestjs/common'

@Injectable()
@Controller('lessons')
export class LessonController {
    constructor(
        private readonly getAllLessonUseCase: GetAllLessonUseCase,
        private readonly getLessonByIdUseCase: GetLessonByIdUseCase,
        private readonly createLessonUseCase: CreateLessonUseCase,
        private readonly updateLessonUseCase: UpdateLessonUseCase,
        private readonly deleteLessonUseCase: DeleteLessonUseCase,
    ) { }

    @Get()
    @RequirePermission('lesson.getAll')
    @HttpCode(HttpStatus.OK)
    async getAllLessons(@Query() query: LessonListQueryDto): Promise<LessonListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllLessonUseCase.execute(query))
    }

    @Get(':id')
    @RequirePermission('lesson.getById')
    @HttpCode(HttpStatus.OK)
    async getLessonById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<LessonResponseDto>> {
        return ExceptionHandler.execute(() => this.getLessonByIdUseCase.execute(id))
    }

    @Post()
    @RequirePermission('lesson.create')
    @HttpCode(HttpStatus.CREATED)
    async createLesson(
        @Body() dto: CreateLessonDto
    ): Promise<BaseResponseDto<LessonResponseDto>> {
        return ExceptionHandler.execute(() => this.createLessonUseCase.execute(dto))
    }

    @Put(':id')
    @RequirePermission('lesson.update')
    @HttpCode(HttpStatus.OK)
    async updateLesson(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateLessonDto
    ): Promise<BaseResponseDto<LessonResponseDto>> {
        return ExceptionHandler.execute(() => this.updateLessonUseCase.execute(id, dto))
    }

    @Delete(':id')
    @RequirePermission('lesson.delete')
    @HttpCode(HttpStatus.OK)
    async deleteLesson(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteLessonUseCase.execute(id))
    }
}
