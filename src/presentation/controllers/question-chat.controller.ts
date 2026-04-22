// src/presentation/controllers/question-chat.controller.ts

import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'

import {
    CreateQuestionChatUseCase,
    GetQuestionChatByIdUseCase,
    GetMyQuestionChatsUseCase,
    UpdateQuestionChatUseCase,
    DeleteQuestionChatUseCase,
} from '../../application/use-cases/question-chat'

import {
    CreateQuestionChatDto,
    UpdateQuestionChatDto,
    QuestionChatListQueryDto,
} from '../../application/dtos'

@Injectable()
@Controller('question-chats')
export class QuestionChatController {
    constructor(
        private readonly createChatUseCase: CreateQuestionChatUseCase,
        private readonly getChatByIdUseCase: GetQuestionChatByIdUseCase,
        private readonly getMyChatsUseCase: GetMyQuestionChatsUseCase,
        private readonly updateChatUseCase: UpdateQuestionChatUseCase,
        private readonly deleteChatUseCase: DeleteQuestionChatUseCase,
    ) { }

    /**
     * GET /question-chats
     * Lấy danh sách cuộc hội thoại của user hiện tại (có phân trang)
     *
     * @input Query params (QuestionChatListQueryDto):
     *   - page?: number          (default: 1)
     *   - limit?: number         (default: 10)
     *   - search?: string        (tìm theo tiêu đề)
     *   - questionId?: number    (lọc theo câu hỏi)
     *   - sortBy?: string        (default: 'updatedAt')
     *   - sortOrder?: 'asc'|'desc' (default: 'desc')
     *
     * @output QuestionChatListResponseDto (extends PaginationResponseDto)
     *   {
     *     success: true,
     *     message: "Lấy danh sách cuộc hội thoại thành công",
     *     data: [
     *       {
     *         chatId: number,
     *         userId: number,
     *         questionId: number,
     *         title: string | null,
     *         createdAt: Date,
     *         updatedAt: Date,
     *         lastMessage: {
     *           messageId, chatId, role, content,
     *           contentHtml: string | null,  ← HTML nếu role=AI
     *           metadata, createdAt
     *         } | null
     *       }
     *     ],
     *     meta: { page, limit, total, totalPages, hasPrevious, hasNext, previousPage?, nextPage? }
     *   }
     */
    @Get()
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getMyChats(
        @Query() query: QuestionChatListQueryDto,
        @CurrentUser('userId') userId: number,
    ) {
        return ExceptionHandler.execute(() =>
            this.getMyChatsUseCase.execute(userId, query),
        )
    }

    /**
     * GET /question-chats/:id
     * Lấy chi tiết cuộc hội thoại (bao gồm danh sách messages)
     *
     * @input Params:
     *   - id: number (chatId)
     *
     * @output BaseResponseDto<QuestionChatResponseDto>
     *   {
     *     success: true,
     *     message: "Lấy thông tin cuộc hội thoại thành công",
     *     data: {
     *       chatId: number,
     *       userId: number,
     *       questionId: number,
     *       title: string | null,
     *       createdAt: Date,
     *       updatedAt: Date,
     *       messages: [
     *         {
     *           messageId, chatId, role: 'USER'|'AI',
     *           content: string,
     *           contentHtml: string | null,  ← HTML đã render nếu role=AI
     *           metadata, createdAt
     *         }
     *       ]
     *     }
     *   }
     *
     * @throws NotFoundException nếu chatId không tồn tại
     */
    @Get(':id')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getById(@Param('id', ParseIntPipe) id: number) {
        return ExceptionHandler.execute(() =>
            this.getChatByIdUseCase.execute(id),
        )
    }

    /**
     * POST /question-chats
     * Tạo cuộc hội thoại mới cho một câu hỏi
     *
     * @input Body (CreateQuestionChatDto):
     *   - questionId: number  (bắt buộc - ID câu hỏi)
     *   - title?: string      (tuỳ chọn - tiêu đề, maxLength: 255)
     *
     * @note userId được lấy tự động từ token của user đang đăng nhập
     *
     * @output BaseResponseDto<QuestionChatResponseDto>
     *   {
     *     success: true,
     *     message: "Tạo cuộc hội thoại thành công",
     *     data: {
     *       chatId: number,
     *       userId: number,
     *       questionId: number,
     *       title: string | null,
     *       createdAt: Date,
     *       updatedAt: Date
     *     }
     *   }
     *
     * @throws NotFoundException nếu questionId không tồn tại
     */
    @Post()
    @RequirePermission()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateQuestionChatDto,
        @CurrentUser('userId') userId: number,
    ) {
        return ExceptionHandler.execute(() =>
            this.createChatUseCase.execute({
                ...dto,
                userId,
            }),
        )
    }

    /**
     * PUT /question-chats/:id
     * Cập nhật cuộc hội thoại (đổi tiêu đề)
     *
     * @input Params:
     *   - id: number (chatId)
     * @input Body (UpdateQuestionChatDto):
     *   - title?: string (tiêu đề mới, maxLength: 255)
     *
     * @output BaseResponseDto<QuestionChatResponseDto>
     *   {
     *     success: true,
     *     message: "Cập nhật cuộc hội thoại thành công",
     *     data: {
     *       chatId, userId, questionId, title, createdAt, updatedAt
     *     }
     *   }
     *
     * @throws NotFoundException nếu chatId không tồn tại
     */
    @Put(':id')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateQuestionChatDto,
    ) {
        return ExceptionHandler.execute(() =>
            this.updateChatUseCase.execute(id, dto),
        )
    }

    /**
     * DELETE /question-chats/:id
     * Xoá cuộc hội thoại (bao gồm tất cả tin nhắn bên trong)
     *
     * @input Params:
     *   - id: number (chatId)
     *
     * @output BaseResponseDto<{ deleted: boolean }>
     *   {
     *     success: true,
     *     message: "Xóa cuộc hội thoại thành công",
     *     data: { deleted: true }
     *   }
     *
     * @throws NotFoundException nếu chatId không tồn tại
     */
    @Delete(':id')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async delete(@Param('id', ParseIntPipe) id: number) {
        return ExceptionHandler.execute(() =>
            this.deleteChatUseCase.execute(id),
        )
    }
}