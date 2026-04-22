// src/presentation/controllers/question-chat-message.controller.ts

import {
    Controller,
    Get,
    Post,
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
import { RequirePermission } from '../../shared/decorators/permissions.decorator'

import {
    CreateMessageUseCase,
    GetMessagesByChatUseCase,
    DeleteMessageUseCase,
} from '../../application/use-cases/question-chat-message'

import {
    CreateQuestionChatMessageDto,
    QuestionChatMessageListQueryDto,
} from '../../application/dtos'

@Injectable()
@Controller('question-chat-messages')
export class QuestionChatMessageController {
    constructor(
        private readonly createMessageUseCase: CreateMessageUseCase,
        private readonly getMessagesUseCase: GetMessagesByChatUseCase,
        private readonly deleteMessageUseCase: DeleteMessageUseCase,
    ) { }

    /**
     * GET /question-chat-messages?chatId=xxx
     * Lấy danh sách tin nhắn theo cuộc hội thoại (có phân trang)
     *
     * @input Query params:
     *   - chatId: number          (bắt buộc - ID cuộc hội thoại)
     *   - page?: number           (default: 1)
     *   - limit?: number          (default: 20)
     *   - role?: 'USER'|'AI'      (tuỳ chọn - lọc theo vai trò)
     *   - sortOrder?: 'asc'|'desc' (default: 'asc' - theo thứ tự thời gian)
     *
     * @output QuestionChatMessageListResponseDto (extends PaginationResponseDto)
     *   {
     *     success: true,
     *     message: "Lấy danh sách tin nhắn thành công",
     *     data: [
     *       {
     *         messageId: number,
     *         chatId: number,
     *         role: 'USER' | 'AI',
     *         content: string,                 ← nội dung Markdown gốc
     *         contentHtml: string | null,       ← HTML đã render (chỉ khi role=AI)
     *         metadata: { ... } | null,
     *         createdAt: Date
     *       }
     *     ],
     *     meta: { page, limit, total, totalPages, hasPrevious, hasNext, previousPage?, nextPage? }
     *   }
     *
     * @throws NotFoundException nếu chatId không tồn tại
     */
    @Get()
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getByChat(
        @Query('chatId', ParseIntPipe) chatId: number,
        @Query() query: QuestionChatMessageListQueryDto,
    ) {
        return ExceptionHandler.execute(() =>
            this.getMessagesUseCase.execute(chatId, query),
        )
    }

    /**
     * POST /question-chat-messages
     * Tạo tin nhắn mới. Nếu role = 'USER', hệ thống sẽ tự động gọi AI
     * để sinh câu trả lời và lưu thêm một tin nhắn AI.
     *
     * @input Body (CreateQuestionChatMessageDto):
     *   - chatId: number                    (bắt buộc - ID cuộc hội thoại)
     *   - role: 'USER' | 'AI'               (bắt buộc - vai trò người gửi)
     *   - content: string                   (bắt buộc - nội dung tin nhắn, maxLength: 10000)
     *   - metadata?: Record<string, any>    (tuỳ chọn - dữ liệu bổ sung)
     *
     * @output BaseResponseDto<QuestionChatMessageResponseDto>
     *   Nếu role = 'USER':
     *   → Trả về tin nhắn AI được sinh tự động:
     *   {
     *     success: true,
     *     message: "Tạo tin nhắn thành công",
     *     data: {
     *       messageId: number,
     *       chatId: number,
     *       role: 'AI',
     *       content: string,                ← Markdown gốc từ AI (thầy Bee)
     *       contentHtml: string,            ← HTML đã render (Markdown + LaTeX → HTML)
     *       metadata: {
     *         model: string,                ← model AI (gpt-4o / gpt-4o-mini)
     *         promptTokens: number,
     *         completionTokens: number,
     *         totalTokens: number,
     *         questionId: number,
     *         imageCount: number
     *       },
     *       createdAt: Date
     *     }
     *   }
     *
     *   Nếu role = 'AI' (gửi thủ công):
     *   → Trả về tin nhắn vừa tạo (có contentHtml đã render):
     *   {
     *     success: true,
     *     message: "Tạo tin nhắn thành công",
     *     data: { messageId, chatId, role, content, contentHtml, metadata, createdAt }
     *   }
     *
     * @throws NotFoundException nếu chatId hoặc questionId không tồn tại
     */
    @Post()
    @RequirePermission()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateQuestionChatMessageDto) {
        return ExceptionHandler.execute(() =>
            this.createMessageUseCase.execute(dto),
        )
    }

    /**
     * DELETE /question-chat-messages/:id
     * Xoá một tin nhắn
     *
     * @input Params:
     *   - id: number (messageId)
     *
     * @output BaseResponseDto<{ deleted: boolean }>
     *   {
     *     success: true,
     *     message: "Xóa tin nhắn thành công",
     *     data: { deleted: true }
     *   }
     *
     * @throws NotFoundException nếu messageId không tồn tại
     */
    @Delete(':id')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async delete(@Param('id', ParseIntPipe) id: number) {
        return ExceptionHandler.execute(() =>
            this.deleteMessageUseCase.execute(id),
        )
    }
}