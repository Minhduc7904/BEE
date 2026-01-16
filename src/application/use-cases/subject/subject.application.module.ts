import { Module } from '@nestjs/common'

import * as subjectUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const SUBJECT_USE_CASES = [
  subjectUseCase.CreateSubjectUseCase,
  subjectUseCase.GetSubjectUseCase,
  subjectUseCase.GetAllSubjectsUseCase,
  subjectUseCase.UpdateSubjectUseCase,
  subjectUseCase.DeleteSubjectUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: SUBJECT_USE_CASES,
  exports: SUBJECT_USE_CASES,
})
export class SubjectApplicationModule {}
