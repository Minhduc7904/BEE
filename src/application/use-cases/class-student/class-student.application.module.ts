import { Module } from '@nestjs/common'

import * as classStudentUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const CLASS_STUDENT_USE_CASES = [
  classStudentUseCase.GetAllClassStudentUseCase,
  classStudentUseCase.CreateClassStudentUseCase,
  classStudentUseCase.DeleteClassStudentUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: CLASS_STUDENT_USE_CASES,
  exports: CLASS_STUDENT_USE_CASES,
})
export class ClassStudentApplicationModule {}
