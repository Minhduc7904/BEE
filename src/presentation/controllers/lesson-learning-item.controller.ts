// src/presentation/controllers/lesson-learning-item.controller.ts
import { Controller, Get, Post, Delete, Put, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { LessonLearningItemListQueryDto } from '../../application/dtos/lessonLearningItem/lesson-learning-item-list-query.dto'
import { CreateLessonLearningItemDto, ReorderLessonLearningItemsDto } from '../../application/dtos/lessonLearningItem'
import { LessonLearningItemListResponseDto, LessonLearningItemResponseDto } from '../../application/dtos/lessonLearningItem/lesson-learning-item.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
    GetAllLessonLearningItemUseCase,
    GetLessonLearningItemByIdUseCase,
    CreateLessonLearningItemUseCase,
    DeleteLessonLearningItemUseCase,
    ReorderLessonLearningItemsUseCase,
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
        private readonly reorderLessonLearningItemsUseCase: ReorderLessonLearningItemsUseCase,
    ) { }

    @Get()
    @RequirePermission(PERMISSION_CODES.LESSON_LEARNING_ITEM.GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAllLessonLearningItems(@Query() query: LessonLearningItemListQueryDto): Promise<LessonLearningItemListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllLessonLearningItemUseCase.execute(query))
    }

    @Get(':lessonId/:learningItemId')
    @RequirePermission(PERMISSION_CODES.LESSON_LEARNING_ITEM.GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getLessonLearningItemById(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('learningItemId', ParseIntPipe) learningItemId: number
    ): Promise<BaseResponseDto<LessonLearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.getLessonLearningItemByIdUseCase.execute(lessonId, learningItemId))
    }

    @Post()
    @RequirePermission(PERMISSION_CODES.LESSON_LEARNING_ITEM.CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createLessonLearningItem(
        @Body() dto: CreateLessonLearningItemDto
    ): Promise<BaseResponseDto<LessonLearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.createLessonLearningItemUseCase.execute(dto))
    }

    /**
     * Cập nhật lại thứ tự cho nhiều LessonLearningItem
     * PUT /lesson-learning-items/reorder
     */
    @Put('reorder')
    @RequirePermission(PERMISSION_CODES.LESSON_LEARNING_ITEM.UPDATE)
    @HttpCode(HttpStatus.OK)
    async reorderLessonLearningItems(
        @Body() dto: ReorderLessonLearningItemsDto,
    ): Promise<BaseResponseDto<boolean>> {
        return ExceptionHandler.execute(() =>
            this.reorderLessonLearningItemsUseCase.execute(dto),
        )
    }

    @Delete(':lessonId/:learningItemId')
    @RequirePermission(PERMISSION_CODES.LESSON_LEARNING_ITEM.DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteLessonLearningItem(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('learningItemId', ParseIntPipe) learningItemId: number
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteLessonLearningItemUseCase.execute(lessonId, learningItemId))
    }
}
