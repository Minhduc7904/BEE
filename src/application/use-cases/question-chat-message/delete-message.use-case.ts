// src/application/use-cases/question-chat-message/delete-message.use-case.ts

import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class DeleteMessageUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(messageId: number): Promise<BaseResponseDto<{ deleted: boolean }>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionChatMessageRepository = repos.questionChatMessageRepository

      // Kiểm tra message có tồn tại không
      const existingMessage = await questionChatMessageRepository.findById(messageId)
      if (!existingMessage) {
        throw new NotFoundException(`Không tìm thấy tin nhắn với ID ${messageId}`)
      }

      // Xóa message
      await questionChatMessageRepository.delete(messageId)

      return { deleted: true }
    })

    return BaseResponseDto.success('Xóa tin nhắn thành công', result)
  }
}
