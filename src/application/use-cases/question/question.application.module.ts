// src/application/use-cases/question/question.application.module.ts
import { Module } from '@nestjs/common'

import * as questionUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'

const QUESTION_USE_CASES = [
  questionUseCase.GetAllQuestionsUseCase,
  questionUseCase.GetQuestionByIdUseCase,
  questionUseCase.CreateQuestionUseCase,
  questionUseCase.UpdateQuestionUseCase,
  questionUseCase.DeleteQuestionUseCase,
  questionUseCase.GetQuestionsByExamUseCase,
  questionUseCase.ReorderQuestionsUseCase,
  questionUseCase.RemoveQuestionFromExamUseCase,
  questionUseCase.AddQuestionToSectionUseCase,
  AttachMediaFromContentUseCase,
  ProcessContentWithPresignedUrlsUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: QUESTION_USE_CASES,
  exports: QUESTION_USE_CASES,
})
export class QuestionApplicationModule {}
