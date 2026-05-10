// src/application/use-cases/exam/exam.application.module.ts
import { Module } from '@nestjs/common'

import * as examUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'

const EXAM_USE_CASES = [
  examUseCase.GetAllExamsUseCase,
  examUseCase.GetExamByIdUseCase,
  examUseCase.CreateExamUseCase,
  examUseCase.UpdateExamUseCase,
  examUseCase.DeleteExamUseCase,
  examUseCase.SearchExamsUseCase,
  examUseCase.GetPublicExamTypeCountsUseCase,
  examUseCase.GetPublicStudentExamsUseCase,
  examUseCase.GetPublicStudentExamByIdUseCase,
  examUseCase.GetPublicStudentExamBySlugUseCase,
  examUseCase.GetPublicStudentExamContentUseCase,
  examUseCase.GenerateMissingExamSlugsUseCase,
  examUseCase.GetPublicSeoRelatedExamsBySlugUseCase,
  examUseCase.GetPublicSeoLatestExamsUseCase,
  AttachMediaFromContentUseCase,
  ProcessContentWithPresignedUrlsUseCase,
  ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: EXAM_USE_CASES,
  exports: EXAM_USE_CASES,
})
export class ExamApplicationModule {}
