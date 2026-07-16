// src/application/use-cases/question-chat-message/create-message.use-case.ts

import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, CreateQuestionChatMessageDto, QuestionChatMessageResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { QuestionChatRole } from '../../../shared/enums'
import { QuestionChatAIService } from 'src/application/interfaces'
import { MarkdownRenderService } from 'src/application/interfaces'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class CreateMessageUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly questionChatAIService: QuestionChatAIService,
    private readonly markdownRenderService: MarkdownRenderService,
  ) {}

  async execute(dto: CreateQuestionChatMessageDto): Promise<BaseResponseDto<QuestionChatMessageResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionChatRepository = repos.questionChatRepository
      const questionChatMessageRepository = repos.questionChatMessageRepository
      const questionRepository = repos.questionRepository

      // Kiểm tra chat có tồn tại không
      const chat = await questionChatRepository.findById(dto.chatId)
      if (!chat) {
        throw new NotFoundException(`Không tìm thấy cuộc hội thoại với ID ${dto.chatId}`)
      }

      // Tạo message của user
      const userMessage = await questionChatMessageRepository.create({
        chatId: dto.chatId,
        role: dto.role,
        content: dto.content,
        metadata: dto.metadata ?? null,
      })

      // Cập nhật updatedAt của chat
      await questionChatRepository.update(dto.chatId, {})

      // Nếu role là USER → gọi AI trả lời
      if (dto.role === QuestionChatRole.USER) {
        try {
          // Lấy thông tin question (bao gồm statements, solution, ảnh)
          const question = await questionRepository.findById(chat.questionId)
          if (!question) {
            throw new NotFoundException(`Không tìm thấy câu hỏi với ID ${chat.questionId}`)
          }

          // Lấy lịch sử chat (trước tin nhắn hiện tại)
          const historyResult = await questionChatMessageRepository.findByChatId(
            dto.chatId,
            { page: 1, limit: 50 },
            { chatId: dto.chatId },
          )
          // Loại bỏ tin nhắn vừa tạo khỏi history
          const chatHistory = historyResult.messages.filter(
            (m) => m.messageId !== userMessage.messageId,
          )

          // Gọi AI sinh câu trả lời
          const aiResponse = await this.questionChatAIService.generateAnswer(
            question,
            dto.content,
            chatHistory,
          )

          // Lưu tin nhắn AI vào database
          const aiMessage = await questionChatMessageRepository.create({
            chatId: dto.chatId,
            role: QuestionChatRole.AI,
            content: aiResponse.content,
            metadata: aiResponse.metadata,
          })

          // Cập nhật updatedAt của chat
          await questionChatRepository.update(dto.chatId, {})

          // Trả về tin nhắn AI (client sẽ thấy cả user message + AI message)
          return QuestionChatMessageResponseDto.fromMessage(aiMessage)
        } catch (error: any) {
          // Nếu AI lỗi, vẫn lưu tin nhắn lỗi để user biết
          const errorMessage = await questionChatMessageRepository.create({
            chatId: dto.chatId,
            role: QuestionChatRole.AI,
            content: 'Xin lỗi, thầy đang gặp sự cố kỹ thuật. Con vui lòng thử lại sau nhé! 🙏',
            metadata: { error: error?.message || 'Unknown error' },
          })

          return QuestionChatMessageResponseDto.fromMessage(errorMessage)
        }
      }

      // Nếu role là AI (gửi thủ công) → trả về message trực tiếp
      return QuestionChatMessageResponseDto.fromMessage(userMessage)
    })

    // Render HTML cho tin nhắn AI
    if (result.role === QuestionChatRole.AI && result.content) {
      result.contentHtml = this.markdownRenderService.renderToHtml(result.content)
    }

    return BaseResponseDto.success('Tạo tin nhắn thành công', result)
  }
}
