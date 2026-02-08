// src/presentation/controllers/learning-item.controller.ts
import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { LearningItemListQueryDto } from '../../application/dtos/learningItem/learning-item-list-query.dto'
import { CreateLearningItemDto } from '../../application/dtos/learningItem/create-learning-item.dto'
import { UpdateLearningItemDto } from '../../application/dtos/learningItem/update-learning-item.dto'
import { LearningItemListResponseDto, LearningItemResponseDto } from '../../application/dtos/learningItem/learning-item.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
    GetAllLearningItemUseCase,
    GetLearningItemByIdUseCase,
    CreateLearningItemUseCase,
    UpdateLearningItemUseCase,
    DeleteLearningItemUseCase,
} from '../../application/use-cases/learningItem'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'

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
    @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAllLearningItems(@Query() query: LearningItemListQueryDto): Promise<LearningItemListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllLearningItemUseCase.execute(query))
    }

    @Get('admin/my')
    @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.GET_MY_LEARNING_ITEMS)
    @HttpCode(HttpStatus.OK)
    async getMyLearningItems(
        @Query() query: LearningItemListQueryDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<LearningItemListResponseDto> {
        query.createdBy = adminId
        return ExceptionHandler.execute(() => this.getAllLearningItemUseCase.execute(query))
    }

    @Get(':id')
    @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getLearningItemById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<LearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.getLearningItemByIdUseCase.execute(id))
    }

    @Post()
    @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createLearningItem(
        @Body() dto: CreateLearningItemDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<LearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.createLearningItemUseCase.execute(dto, adminId))
    }

    @Put(':id')
    @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.UPDATE)
    @HttpCode(HttpStatus.OK)
    async updateLearningItem(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateLearningItemDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<LearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.updateLearningItemUseCase.execute(id, dto, adminId))
    }

    @Delete(':id')
    @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteLearningItem(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteLearningItemUseCase.execute(id, adminId))
    }
}
