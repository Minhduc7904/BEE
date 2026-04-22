import { Module } from '@nestjs/common'

import * as questionChatMessageUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const QUESTION_CHAT_MESSAGE_USE_CASES = [
  questionChatMessageUseCase.CreateMessageUseCase,
  questionChatMessageUseCase.GetMessagesByChatUseCase,
  questionChatMessageUseCase.DeleteMessageUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: QUESTION_CHAT_MESSAGE_USE_CASES,
  exports: QUESTION_CHAT_MESSAGE_USE_CASES,
})
export class QuestionChatMessageApplicationModule {}
