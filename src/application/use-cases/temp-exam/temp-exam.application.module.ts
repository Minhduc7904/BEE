import { Module } from '@nestjs/common'

import * as tempExamUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'

const TEMP_EXAM_USE_CASES = [
  tempExamUseCase.GetTempExamBySessionUseCase,
  tempExamUseCase.CreateTempExamUseCase,
  tempExamUseCase.UpdateTempExamUseCase,
  AttachMediaFromContentUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: TEMP_EXAM_USE_CASES,
  exports: TEMP_EXAM_USE_CASES,
})
export class TempExamApplicationModule {}