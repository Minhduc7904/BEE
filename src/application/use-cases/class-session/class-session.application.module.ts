import { Module } from '@nestjs/common'

import * as classSessionUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const CLASS_SESSION_USE_CASES = [
  classSessionUseCase.GetAllClassSessionUseCase,
  classSessionUseCase.GetClassSessionByIdUseCase,
  classSessionUseCase.CreateClassSessionUseCase,
  classSessionUseCase.UpdateClassSessionUseCase,
  classSessionUseCase.DeleteClassSessionUseCase,
  classSessionUseCase.GetStudentClassSessionsUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: CLASS_SESSION_USE_CASES,
  exports: CLASS_SESSION_USE_CASES,
})
export class ClassSessionApplicationModule {}
