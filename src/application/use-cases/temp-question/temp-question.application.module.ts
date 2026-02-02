// src/application/use-cases/temp-question/temp-question.application.module.ts
import { Module } from '@nestjs/common'

import * as tempQuestionUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const TEMP_QUESTION_USE_CASES = [
  tempQuestionUseCase.GetTempQuestionsBySessionUseCase,
  tempQuestionUseCase.GetTempQuestionByIdUseCase,
  tempQuestionUseCase.CreateTempQuestionUseCase,
  tempQuestionUseCase.UpdateTempQuestionUseCase,
  tempQuestionUseCase.DeleteTempQuestionUseCase,
  tempQuestionUseCase.ReorderTempQuestionsUseCase,
  tempQuestionUseCase.LinkQuestionToSectionUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: TEMP_QUESTION_USE_CASES,
  exports: TEMP_QUESTION_USE_CASES,
})
export class TempQuestionApplicationModule {}
