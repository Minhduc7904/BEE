// src/presentation/controllers/homework-content.controller.ts
import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { HomeworkContentListQueryDto } from '../../application/dtos/homeworkContent/homework-content-list-query.dto'
import { CreateHomeworkContentDto } from '../../application/dtos/homeworkContent/create-homework-content.dto'
import { UpdateHomeworkContentDto } from '../../application/dtos/homeworkContent/update-homework-content.dto'
import { HomeworkContentListResponseDto, HomeworkContentResponseDto } from '../../application/dtos/homeworkContent/homework-content.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
    GetAllHomeworkContentUseCase,
    GetHomeworkContentByIdUseCase,
    CreateHomeworkContentUseCase,
    UpdateHomeworkContentUseCase,
    DeleteHomeworkContentUseCase,
} from '../../application/use-cases/homeworkContent'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'

@Injectable()
@Controller('homework-contents')
export class HomeworkContentController {
    constructor(
        private readonly getAllHomeworkContentUseCase: GetAllHomeworkContentUseCase,
        private readonly getHomeworkContentByIdUseCase: GetHomeworkContentByIdUseCase,
        private readonly createHomeworkContentUseCase: CreateHomeworkContentUseCase,
        private readonly updateHomeworkContentUseCase: UpdateHomeworkContentUseCase,
        private readonly deleteHomeworkContentUseCase: DeleteHomeworkContentUseCase,
    ) { }

    @Get()
    @RequirePermission('homeworkContent.getAll')
    @HttpCode(HttpStatus.OK)
    async getAllHomeworkContents(@Query() query: HomeworkContentListQueryDto): Promise<HomeworkContentListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllHomeworkContentUseCase.execute(query))
    }

    @Get(':id')
    @RequirePermission('homeworkContent.getById')
    @HttpCode(HttpStatus.OK)
    async getHomeworkContentById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<HomeworkContentResponseDto>> {
        return ExceptionHandler.execute(() => this.getHomeworkContentByIdUseCase.execute(id))
    }

    @Post()
    @RequirePermission('homeworkContent.create')
    @HttpCode(HttpStatus.CREATED)
    async createHomeworkContent(
        @Body() dto: CreateHomeworkContentDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<HomeworkContentResponseDto>> {
        return ExceptionHandler.execute(() => this.createHomeworkContentUseCase.execute(dto, adminId))
    }

    @Put(':id')
    @RequirePermission('homeworkContent.update')
    @HttpCode(HttpStatus.OK)
    async updateHomeworkContent(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateHomeworkContentDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<HomeworkContentResponseDto>> {
        return ExceptionHandler.execute(() => this.updateHomeworkContentUseCase.execute(id, dto, adminId))
    }

    @Delete(':id')
    @RequirePermission('homeworkContent.delete')
    @HttpCode(HttpStatus.OK)
    async deleteHomeworkContent(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteHomeworkContentUseCase.execute(id, adminId))
    }
}
