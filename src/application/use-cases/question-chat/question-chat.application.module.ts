import { Module } from '@nestjs/common'

import * as questionChatUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const QUESTION_CHAT_USE_CASES = [
  questionChatUseCase.CreateQuestionChatUseCase,
  questionChatUseCase.GetQuestionChatByIdUseCase,
  questionChatUseCase.GetMyQuestionChatsUseCase,
  questionChatUseCase.UpdateQuestionChatUseCase,
  questionChatUseCase.DeleteQuestionChatUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: QUESTION_CHAT_USE_CASES,
  exports: QUESTION_CHAT_USE_CASES,
})
export class QuestionChatApplicationModule {}
