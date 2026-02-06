// src/application/use-cases/section/section.application.module.ts
import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'
import * as sectionUseCase from './index'

const SECTION_USE_CASES = [
  sectionUseCase.GetSectionsByExamUseCase,
  sectionUseCase.GetSectionByIdUseCase,
  sectionUseCase.CreateSectionUseCase,
  sectionUseCase.UpdateSectionUseCase,
  sectionUseCase.DeleteSectionUseCase,
  AttachMediaFromContentUseCase,
  ProcessContentWithPresignedUrlsUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: [...SECTION_USE_CASES],
  exports: [...SECTION_USE_CASES],
})
export class SectionApplicationModule {}
