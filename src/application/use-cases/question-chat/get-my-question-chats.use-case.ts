// src/application/use-cases/question-chat/get-my-question-chats.use-case.ts

import { Injectable, Inject } from '@nestjs/common'
import {
  QuestionChatListResponseDto,
  QuestionChatResponseDto,
  QuestionChatListQueryDto,
} from '../../dtos'
import { MarkdownRenderService } from 'src/application/interfaces'
import { QuestionChatRole } from '../../../shared/enums'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetMyQuestionChatsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly markdownRenderService: MarkdownRenderService,
  ) {}

  async execute(
    userId: number,
    query: QuestionChatListQueryDto,
  ): Promise<QuestionChatListResponseDto> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionChatRepository = repos.questionChatRepository

      const pagination = query.toPaginationOptions()
      const filters = query.toFilterOptions()

      return questionChatRepository.findByUser(
        userId,
        pagination,
        { ...filters, userId },
      )
    })

    // Map to response DTOs
    const chatDtos = QuestionChatResponseDto.fromChatList(result.chats)

    // Render HTML cho lastMessage nếu role = AI
    for (const dto of chatDtos) {
      if (dto.lastMessage && dto.lastMessage.role === QuestionChatRole.AI && dto.lastMessage.content) {
        dto.lastMessage.contentHtml = this.markdownRenderService.renderToHtml(dto.lastMessage.content)
      }
    }

    return new QuestionChatListResponseDto(
      chatDtos,
      result.page,
      result.limit,
      result.total,
    )
  }
}
