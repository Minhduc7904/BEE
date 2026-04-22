// src/application/use-cases/question-chat/update-question-chat.use-case.ts

import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, UpdateQuestionChatDto, QuestionChatResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class UpdateQuestionChatUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    chatId: number,
    dto: UpdateQuestionChatDto,
  ): Promise<BaseResponseDto<QuestionChatResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionChatRepository = repos.questionChatRepository

      // Kiểm tra chat có tồn tại không
      const existingChat = await questionChatRepository.findById(chatId)
      if (!existingChat) {
        throw new NotFoundException(`Không tìm thấy cuộc hội thoại với ID ${chatId}`)
      }

      // Cập nhật title
      const updated = await questionChatRepository.update(chatId, {
        title: dto.title,
      })

      return QuestionChatResponseDto.fromChat(updated)
    })

    return BaseResponseDto.success('Cập nhật cuộc hội thoại thành công', result)
  }
}
