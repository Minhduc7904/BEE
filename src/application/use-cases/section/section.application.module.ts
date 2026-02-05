// src/application/use-cases/section/section.application.module.ts
import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import * as sectionUseCase from './index'

const SECTION_USE_CASES = [
  sectionUseCase.GetSectionsByExamUseCase,
  sectionUseCase.GetSectionByIdUseCase,
  sectionUseCase.CreateSectionUseCase,
  sectionUseCase.UpdateSectionUseCase,
  sectionUseCase.DeleteSectionUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: [...SECTION_USE_CASES],
  exports: [...SECTION_USE_CASES],
})
export class SectionApplicationModule {}
