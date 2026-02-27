import { Module } from '@nestjs/common'

import * as examImportSessionUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const EXAM_IMPORT_SESSION_USE_CASES = [
  examImportSessionUseCase.CreateExamImportSessionUseCase,
  examImportSessionUseCase.GetAllExamImportSessionsUseCase,
  examImportSessionUseCase.GetExamImportSessionByIdUseCase,
  examImportSessionUseCase.GetExamImportSessionRawContentUseCase,
  examImportSessionUseCase.UpdateExamImportSessionRawContentUseCase,
  examImportSessionUseCase.SplitExamFromSessionUseCase,
  examImportSessionUseCase.SplitExamFromRawContentUseCase,
  examImportSessionUseCase.SaveSplitResultToTempUseCase,
  examImportSessionUseCase.ClassifyQuestionChaptersUseCase,
  examImportSessionUseCase.MigrateTempToFinalExamUseCase,
  examImportSessionUseCase.ManualSplitQuestionsUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: EXAM_IMPORT_SESSION_USE_CASES,
  exports: EXAM_IMPORT_SESSION_USE_CASES,
})
export class ExamImportSessionApplicationModule {}
