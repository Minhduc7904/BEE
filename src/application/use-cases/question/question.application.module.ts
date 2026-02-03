// src/application/use-cases/question/question.application.module.ts
import { Module } from '@nestjs/common'

import * as questionUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const QUESTION_USE_CASES = [
  questionUseCase.GetAllQuestionsUseCase,
  questionUseCase.GetQuestionByIdUseCase,
  questionUseCase.CreateQuestionUseCase,
  questionUseCase.UpdateQuestionUseCase,
  questionUseCase.DeleteQuestionUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: QUESTION_USE_CASES,
  exports: QUESTION_USE_CASES,
})
export class QuestionApplicationModule {}
