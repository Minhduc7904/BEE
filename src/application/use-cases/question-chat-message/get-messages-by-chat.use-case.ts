// src/application/use-cases/question-chat-message/get-messages-by-chat.use-case.ts

import { Injectable, Inject } from '@nestjs/common'
import {
  QuestionChatMessageListResponseDto,
  QuestionChatMessageResponseDto,
  QuestionChatMessageListQueryDto,
} from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { MarkdownRenderService } from 'src/application/interfaces'
import { QuestionChatRole } from '../../../shared/enums'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetMessagesByChatUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly markdownRenderService: MarkdownRenderService,
  ) {}

  async execute(
    chatId: number,
    query: QuestionChatMessageListQueryDto,
  ): Promise<QuestionChatMessageListResponseDto> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionChatRepository = repos.questionChatRepository
      const questionChatMessageRepository = repos.questionChatMessageRepository

      // Kiểm tra chat có tồn tại không
      const chat = await questionChatRepository.findById(chatId)
      if (!chat) {
        throw new NotFoundException(`Không tìm thấy cuộc hội thoại với ID ${chatId}`)
      }

      const pagination = query.toPaginationOptions()
      const filters = query.toFilterOptions(chatId)

      return questionChatMessageRepository.findByChatId(chatId, pagination, filters)
    })

    // Map to response DTOs
    const messageDtos = QuestionChatMessageResponseDto.fromMessageList(result.messages)

    // Render HTML cho tin nhắn AI
    for (const dto of messageDtos) {
      if (dto.role === QuestionChatRole.AI && dto.content) {
        dto.contentHtml = this.markdownRenderService.renderToHtml(dto.content)
      }
    }

    return new QuestionChatMessageListResponseDto(
      messageDtos,
      result.page,
      result.limit,
      result.total,
    )
  }
}
