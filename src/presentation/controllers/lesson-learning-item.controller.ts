// src/presentation/controllers/lesson-learning-item.controller.ts
import { Controller, Get, Post, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { LessonLearningItemListQueryDto } from '../../application/dtos/lessonLearningItem/lesson-learning-item-list-query.dto'
import { CreateLessonLearningItemDto } from '../../application/dtos/lessonLearningItem/create-lesson-learning-item.dto'
import { LessonLearningItemListResponseDto, LessonLearningItemResponseDto } from '../../application/dtos/lessonLearningItem/lesson-learning-item.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
    GetAllLessonLearningItemUseCase,
    GetLessonLearningItemByIdUseCase,
    CreateLessonLearningItemUseCase,
    DeleteLessonLearningItemUseCase,
} from '../../application/use-cases/lessonLearningItem'
import { Injectable } from '@nestjs/common'

@Injectable()
@Controller('lesson-learning-items')
export class LessonLearningItemController {
    constructor(
        private readonly getAllLessonLearningItemUseCase: GetAllLessonLearningItemUseCase,
        private readonly getLessonLearningItemByIdUseCase: GetLessonLearningItemByIdUseCase,
        private readonly createLessonLearningItemUseCase: CreateLessonLearningItemUseCase,
        private readonly deleteLessonLearningItemUseCase: DeleteLessonLearningItemUseCase,
    ) { }

    @Get()
    @RequirePermission('lessonLearningItem.getAll')
    @HttpCode(HttpStatus.OK)
    async getAllLessonLearningItems(@Query() query: LessonLearningItemListQueryDto): Promise<LessonLearningItemListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllLessonLearningItemUseCase.execute(query))
    }

    @Get(':lessonId/:learningItemId')
    @RequirePermission('lessonLearningItem.getById')
    @HttpCode(HttpStatus.OK)
    async getLessonLearningItemById(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('learningItemId', ParseIntPipe) learningItemId: number
    ): Promise<BaseResponseDto<LessonLearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.getLessonLearningItemByIdUseCase.execute(lessonId, learningItemId))
    }

    @Post()
    @RequirePermission('lessonLearningItem.create')
    @HttpCode(HttpStatus.CREATED)
    async createLessonLearningItem(
        @Body() dto: CreateLessonLearningItemDto
    ): Promise<BaseResponseDto<LessonLearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.createLessonLearningItemUseCase.execute(dto))
    }

    @Delete(':lessonId/:learningItemId')
    @RequirePermission('lessonLearningItem.delete')
    @HttpCode(HttpStatus.OK)
    async deleteLessonLearningItem(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('learningItemId', ParseIntPipe) learningItemId: number
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteLessonLearningItemUseCase.execute(lessonId, learningItemId))
    }
}
