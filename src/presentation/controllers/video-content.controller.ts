// src/presentation/controllers/video-content.controller.ts
import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { VideoContentListQueryDto } from '../../application/dtos/videoContent/video-content-list-query.dto'
import { CreateVideoContentDto } from '../../application/dtos/videoContent/create-video-content.dto'
import { UpdateVideoContentDto } from '../../application/dtos/videoContent/update-video-content.dto'
import { VideoContentListResponseDto, VideoContentResponseDto } from '../../application/dtos/videoContent/video-content.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
    GetAllVideoContentUseCase,
    GetVideoContentByIdUseCase,
    CreateVideoContentUseCase,
    UpdateVideoContentUseCase,
    DeleteVideoContentUseCase,
} from '../../application/use-cases/videoContent'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'

@Injectable()
@Controller('video-contents')
export class VideoContentController {
    constructor(
        private readonly getAllVideoContentUseCase: GetAllVideoContentUseCase,
        private readonly getVideoContentByIdUseCase: GetVideoContentByIdUseCase,
        private readonly createVideoContentUseCase: CreateVideoContentUseCase,
        private readonly updateVideoContentUseCase: UpdateVideoContentUseCase,
        private readonly deleteVideoContentUseCase: DeleteVideoContentUseCase,
    ) { }

    @Get()
    @RequirePermission(PERMISSION_CODES.VIDEO_CONTENT_GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAllVideoContents(@Query() query: VideoContentListQueryDto): Promise<VideoContentListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllVideoContentUseCase.execute(query))
    }

    @Get(':id')
    @RequirePermission(PERMISSION_CODES.VIDEO_CONTENT_GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getVideoContentById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<VideoContentResponseDto>> {
        return ExceptionHandler.execute(() => this.getVideoContentByIdUseCase.execute(id))
    }

    @Post()
    @RequirePermission(PERMISSION_CODES.VIDEO_CONTENT_CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createVideoContent(
        @Body() dto: CreateVideoContentDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<VideoContentResponseDto>> {
        return ExceptionHandler.execute(() => this.createVideoContentUseCase.execute(dto, adminId))
    }

    @Put(':id')
    @RequirePermission(PERMISSION_CODES.VIDEO_CONTENT_UPDATE)
    @HttpCode(HttpStatus.OK)
    async updateVideoContent(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateVideoContentDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<VideoContentResponseDto>> {
        return ExceptionHandler.execute(() => this.updateVideoContentUseCase.execute(id, dto, adminId))
    }

    @Delete(':id')
    @RequirePermission(PERMISSION_CODES.VIDEO_CONTENT_DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteVideoContent(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteVideoContentUseCase.execute(id, adminId))
    }
}
