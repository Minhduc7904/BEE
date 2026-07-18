// src/application/use-cases/question-chat/get-question-chat-by-id.use-case.ts

import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, QuestionChatResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { MarkdownRenderService } from 'src/application/interfaces'
import { QuestionChatRole } from '../../../shared/enums'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetQuestionChatByIdUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly markdownRenderService: MarkdownRenderService,
  ) {}

  async execute(chatId: number): Promise<BaseResponseDto<QuestionChatResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionChatRepository = repos.questionChatRepository

      const chat = await questionChatRepository.findById(chatId)

      if (!chat) {
        throw new NotFoundException(`Không tìm thấy cuộc hội thoại với ID ${chatId}`)
      }

      return QuestionChatResponseDto.fromChatWithMessages(chat)
    })

    // Render HTML cho các tin nhắn AI
    if (result.messages) {
      for (const msg of result.messages) {
        if (msg.role === QuestionChatRole.AI && msg.content) {
          msg.contentHtml = this.markdownRenderService.renderToHtml(msg.content)
        }
      }
    }

    return {
      success: true,
      message: 'Lấy thông tin cuộc hội thoại thành công',
      data: result,
    }
  }
}
