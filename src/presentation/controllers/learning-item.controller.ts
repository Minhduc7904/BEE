// src/presentation/controllers/learning-item.controller.ts
import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { LearningItemListQueryDto } from '../../application/dtos/learningItem/learning-item-list-query.dto'
import { CreateLearningItemDto } from '../../application/dtos/learningItem/create-learning-item.dto'
import { UpdateLearningItemDto } from '../../application/dtos/learningItem/update-learning-item.dto'
import { LearningItemListResponseDto, LearningItemResponseDto } from '../../application/dtos/learningItem/learning-item.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
    GetAllLearningItemUseCase,
    GetLearningItemByIdUseCase,
    CreateLearningItemUseCase,
    UpdateLearningItemUseCase,
    DeleteLearningItemUseCase,
} from '../../application/use-cases/learningItem'
import { Injectable } from '@nestjs/common'

@Injectable()
@Controller('learning-items')
export class LearningItemController {
    constructor(
        private readonly getAllLearningItemUseCase: GetAllLearningItemUseCase,
        private readonly getLearningItemByIdUseCase: GetLearningItemByIdUseCase,
        private readonly createLearningItemUseCase: CreateLearningItemUseCase,
        private readonly updateLearningItemUseCase: UpdateLearningItemUseCase,
        private readonly deleteLearningItemUseCase: DeleteLearningItemUseCase,
    ) { }

    @Get()
    @RequirePermission('learningItem.getAll')
    @HttpCode(HttpStatus.OK)
    async getAllLearningItems(@Query() query: LearningItemListQueryDto): Promise<LearningItemListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllLearningItemUseCase.execute(query))
    }

    @Get(':id')
    @RequirePermission('learningItem.getById')
    @HttpCode(HttpStatus.OK)
    async getLearningItemById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<LearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.getLearningItemByIdUseCase.execute(id))
    }

    @Post()
    @RequirePermission('learningItem.create')
    @HttpCode(HttpStatus.CREATED)
    async createLearningItem(
        @Body() dto: CreateLearningItemDto
    ): Promise<BaseResponseDto<LearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.createLearningItemUseCase.execute(dto))
    }

    @Put(':id')
    @RequirePermission('learningItem.update')
    @HttpCode(HttpStatus.OK)
    async updateLearningItem(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateLearningItemDto
    ): Promise<BaseResponseDto<LearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.updateLearningItemUseCase.execute(id, dto))
    }

    @Delete(':id')
    @RequirePermission('learningItem.delete')
    @HttpCode(HttpStatus.OK)
    async deleteLearningItem(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteLearningItemUseCase.execute(id))
    }
}
