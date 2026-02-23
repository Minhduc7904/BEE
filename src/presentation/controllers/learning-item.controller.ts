// src/presentation/controllers/learning-item.controller.ts
import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe, Req, Res, StreamableFile, Header, UseGuards } from '@nestjs/common'
import type { Request, Response } from 'express'
import { LearningItemListQueryDto } from '../../application/dtos/learningItem/learning-item-list-query.dto'
import { StudentHomeworkQueryDto } from '../../application/dtos/learningItem/student-homework-query.dto'
import { CreateLearningItemDto } from '../../application/dtos/learningItem/create-learning-item.dto'
import { UpdateLearningItemDto } from '../../application/dtos/learningItem/update-learning-item.dto'
import { LearningItemListResponseDto, LearningItemResponseDto } from '../../application/dtos/learningItem/learning-item.dto'
import { StudentHomeworkListResponseDto } from '../../application/dtos/learningItem/student-homework.dto'
import { StudentLearningItemResponseDto } from '../../application/dtos/learningItem/student-learning-item.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
    GetAllLearningItemUseCase,
    GetLearningItemByIdUseCase,
    GetStudentLearningItemByIdUseCase,
    CreateLearningItemUseCase,
    UpdateLearningItemUseCase,
    DeleteLearningItemUseCase,
    GetStudentHomeworksUseCase,
    StreamStudentVideoUseCase,
} from '../../application/use-cases/learningItem'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'
import { VideoStreamAuthGuard } from '../../shared/guards/video-stream-auth.guard'

@Injectable()
@Controller('learning-items')
export class LearningItemController {
    constructor(
        private readonly getAllLearningItemUseCase: GetAllLearningItemUseCase,
        private readonly getLearningItemByIdUseCase: GetLearningItemByIdUseCase,
        private readonly getStudentLearningItemByIdUseCase: GetStudentLearningItemByIdUseCase,
        private readonly createLearningItemUseCase: CreateLearningItemUseCase,
        private readonly updateLearningItemUseCase: UpdateLearningItemUseCase,
        private readonly deleteLearningItemUseCase: DeleteLearningItemUseCase,
        private readonly getStudentHomeworksUseCase: GetStudentHomeworksUseCase,
        private readonly streamStudentVideoUseCase: StreamStudentVideoUseCase,
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

    @Get('student/my-homeworks')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getMyHomeworks(
        @Query() query: StudentHomeworkQueryDto,
        @CurrentUser('studentId') studentId: number,
    ): Promise<StudentHomeworkListResponseDto> {
        return ExceptionHandler.execute(() => this.getStudentHomeworksUseCase.execute(studentId, query))
    }

    /**
     * Get a single learning item by ID (for student)
     * GET /learning-items/:id/student
     * 
     * Trả về:
     * - Thông tin chi tiết learning item
     * - Content tùy theo type (homework, document, youtube, video)
     * - Progress của student (isLearned, learnedAt)
     */
    @Get(':id/student')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getStudentLearningItemById(
        @Param('id', ParseIntPipe) learningItemId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<StudentLearningItemResponseDto>> {
        return ExceptionHandler.execute(() => 
            this.getStudentLearningItemByIdUseCase.execute(learningItemId, studentId)
        )
    }

    /**
     * Stream video with Range Request support (for student)
     * GET /learning-items/:id/student/video/stream/:mediaId?token=xxx
     * 
     * Hỗ trợ HTTP Range Requests để streaming video từng đoạn:
     * - Client gửi header "Range: bytes=0-1023" để request một phần của video
     * - Server trả về status 206 Partial Content với phần được request
     * - Cho phép video player load từng đoạn thay vì load toàn bộ video
     * 
     * ⚠️ AUTHENTICATION VIA QUERY PARAMETER:
     * - HTML5 <video> element KHÔNG hỗ trợ custom headers (như Authorization)
     * - Token phải được gửi qua query parameter: ?token=xxx
     * - VideoStreamAuthGuard sẽ extract và validate token từ query param
     * 
     * @param learningItemId - ID của learning item
     * @param mediaId - ID của media file (video)
     * @param studentId - ID của student (extracted from JWT token in query param)
     * @param req - Express Request để lấy Range header
     * @param res - Express Response để set headers cho streaming
     */
    @Get(':id/student/video/stream/:mediaId')
    @UseGuards(VideoStreamAuthGuard)
    async streamStudentVideo(
        @Param('id', ParseIntPipe) learningItemId: number,
        @Param('mediaId', ParseIntPipe) mediaId: number,
        @CurrentUser('studentId') studentId: number,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        return ExceptionHandler.execute(async () => {
            // Parse Range header (e.g., "bytes=0-1023" or "bytes=1024-")
            const range = req.headers.range
            let rangeStart: number | undefined
            let rangeEnd: number | undefined

            if (range) {
                const parts = range.replace(/bytes=/, '').split('-')
                rangeStart = parts[0] ? parseInt(parts[0], 10) : undefined
                rangeEnd = parts[1] ? parseInt(parts[1], 10) : undefined
            }

            // Get video stream from use case
            const result = await this.streamStudentVideoUseCase.execute(
                learningItemId,
                mediaId,
                studentId,
                rangeStart,
                rangeEnd,
            )

            const { stream, totalSize, contentType, filename } = result

            // Calculate actual range
            const start = rangeStart ?? 0
            const end = rangeEnd ?? totalSize - 1
            const chunkSize = end - start + 1

            // Set appropriate headers for streaming
            if (range) {
                // Partial content response (206)
                res.status(HttpStatus.PARTIAL_CONTENT)
                res.set({
                    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize.toString(),
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=3600',
                })
            } else {
                // Full content response (200)
                res.status(HttpStatus.OK)
                res.set({
                    'Content-Length': totalSize.toString(),
                    'Content-Type': contentType,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'public, max-age=3600',
                })
            }

            return new StreamableFile(stream)
        })
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
