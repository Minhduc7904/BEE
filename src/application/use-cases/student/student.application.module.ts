import { Module } from '@nestjs/common'

import * as studentUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const STUDENT_USE_CASES = [
  studentUseCase.GetAllStudentUseCase,
  studentUseCase.GetProfileStudentUseCase,
  studentUseCase.FetchStudentFromApiUseCase,
  studentUseCase.CreateStudentUseCase,
  studentUseCase.UpdateStudentUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: STUDENT_USE_CASES,
  exports: STUDENT_USE_CASES,
})
export class StudentApplicationModule {}
