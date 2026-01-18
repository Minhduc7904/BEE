// src/presentation/controllers/youtube-content.controller.ts
import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { YoutubeContentListQueryDto } from '../../application/dtos/youtubeContent/youtube-content-list-query.dto'
import { CreateYoutubeContentDto } from '../../application/dtos/youtubeContent/create-youtube-content.dto'
import { UpdateYoutubeContentDto } from '../../application/dtos/youtubeContent/update-youtube-content.dto'
import { YoutubeContentListResponseDto, YoutubeContentResponseDto } from '../../application/dtos/youtubeContent/youtube-content.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
    GetAllYoutubeContentUseCase,
    GetYoutubeContentByIdUseCase,
    CreateYoutubeContentUseCase,
    UpdateYoutubeContentUseCase,
    DeleteYoutubeContentUseCase,
} from '../../application/use-cases/youtubeContent'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'

@Injectable()
@Controller('youtube-contents')
export class YoutubeContentController {
    constructor(
        private readonly getAllYoutubeContentUseCase: GetAllYoutubeContentUseCase,
        private readonly getYoutubeContentByIdUseCase: GetYoutubeContentByIdUseCase,
        private readonly createYoutubeContentUseCase: CreateYoutubeContentUseCase,
        private readonly updateYoutubeContentUseCase: UpdateYoutubeContentUseCase,
        private readonly deleteYoutubeContentUseCase: DeleteYoutubeContentUseCase,
    ) { }

    @Get()
    @RequirePermission('youtubeContent.getAll')
    @HttpCode(HttpStatus.OK)
    async getAllYoutubeContents(@Query() query: YoutubeContentListQueryDto): Promise<YoutubeContentListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllYoutubeContentUseCase.execute(query))
    }

    @Get(':id')
    @RequirePermission('youtubeContent.getById')
    @HttpCode(HttpStatus.OK)
    async getYoutubeContentById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<YoutubeContentResponseDto>> {
        return ExceptionHandler.execute(() => this.getYoutubeContentByIdUseCase.execute(id))
    }

    @Post()
    @RequirePermission('youtubeContent.create')
    @HttpCode(HttpStatus.CREATED)
    async createYoutubeContent(
        @Body() dto: CreateYoutubeContentDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<YoutubeContentResponseDto>> {
        return ExceptionHandler.execute(() => this.createYoutubeContentUseCase.execute(dto, adminId))
    }

    @Put(':id')
    @RequirePermission('youtubeContent.update')
    @HttpCode(HttpStatus.OK)
    async updateYoutubeContent(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateYoutubeContentDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<YoutubeContentResponseDto>> {
        return ExceptionHandler.execute(() => this.updateYoutubeContentUseCase.execute(id, dto, adminId))
    }

    @Delete(':id')
    @RequirePermission('youtubeContent.delete')
    @HttpCode(HttpStatus.OK)
    async deleteYoutubeContent(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteYoutubeContentUseCase.execute(id, adminId))
    }
}
