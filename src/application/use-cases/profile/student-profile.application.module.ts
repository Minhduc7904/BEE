import { Module } from '@nestjs/common'

import * as studentProfileUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const STUDENT_PROFILE_USE_CASES = [
  studentProfileUseCase.GetStudentProfileUseCase,
  studentProfileUseCase.UpdateStudentProfileUseCase,
  studentProfileUseCase.UploadStudentAvatarUseCase,
  studentProfileUseCase.ChangeStudentPasswordUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: STUDENT_PROFILE_USE_CASES,
  exports: STUDENT_PROFILE_USE_CASES,
})
export class StudentProfileApplicationModule {}
