// src/application/use-cases/question-chat/create-question-chat.use-case.ts

import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, CreateQuestionChatDto, QuestionChatResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class CreateQuestionChatUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(dto: CreateQuestionChatDto & { userId: number }): Promise<BaseResponseDto<QuestionChatResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionChatRepository = repos.questionChatRepository
      const questionRepository = repos.questionRepository

      // Kiểm tra question có tồn tại không
      const question = await questionRepository.findById(dto.questionId)
      if (!question) {
        throw new NotFoundException(`Không tìm thấy câu hỏi với ID ${dto.questionId}`)
      }

      // Tạo chat mới
      const chat = await questionChatRepository.create({
        userId: dto.userId,
        questionId: dto.questionId,
        title: dto.title || null,
      })

      return QuestionChatResponseDto.fromChat(chat)
    })

    return BaseResponseDto.success('Tạo cuộc hội thoại thành công', result)
  }
}
