// src/application/use-cases/question-chat/delete-question-chat.use-case.ts

import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class DeleteQuestionChatUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(chatId: number): Promise<BaseResponseDto<{ deleted: boolean }>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionChatRepository = repos.questionChatRepository
      const questionChatMessageRepository = repos.questionChatMessageRepository

      // Kiểm tra chat có tồn tại không
      const existingChat = await questionChatRepository.findById(chatId)
      if (!existingChat) {
        throw new NotFoundException(`Không tìm thấy cuộc hội thoại với ID ${chatId}`)
      }

      // Xóa tất cả messages trước
      await questionChatMessageRepository.deleteByChatId(chatId)

      // Xóa chat
      await questionChatRepository.delete(chatId)

      return { deleted: true }
    })

    return BaseResponseDto.success('Xóa cuộc hội thoại thành công', result)
  }
}
