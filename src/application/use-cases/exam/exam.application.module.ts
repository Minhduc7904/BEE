// src/application/use-cases/exam/exam.application.module.ts
import { Module } from '@nestjs/common'

import * as examUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'

const EXAM_USE_CASES = [
  examUseCase.GetAllExamsUseCase,
  examUseCase.GetExamByIdUseCase,
  examUseCase.CreateExamUseCase,
  examUseCase.UpdateExamUseCase,
  examUseCase.DeleteExamUseCase,
  AttachMediaFromContentUseCase,
  ProcessContentWithPresignedUrlsUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: EXAM_USE_CASES,
  exports: EXAM_USE_CASES,
})
export class ExamApplicationModule {}
