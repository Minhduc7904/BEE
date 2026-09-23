import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { AuthApplicationModule } from '../auth/auth.application.module'
import { StudentProfileApplicationModule } from './student-profile.application.module'
import { GetAvailableParentStudentsUseCase } from './get-available-parent-students.use-case'
import { GetParentProfileUseCase } from './get-parent-profile.use-case'
import { LinkParentStudentUseCase } from './link-parent-student.use-case'
import { UpdateParentProfileUseCase } from './update-parent-profile.use-case'
import { GetParentStudentDetailUseCase } from './get-parent-student-detail.use-case'
import { UnlinkParentStudentUseCase } from './unlink-parent-student.use-case'

const PARENT_PROFILE_USE_CASES = [
  GetParentProfileUseCase,
  GetAvailableParentStudentsUseCase,
  LinkParentStudentUseCase,
  UpdateParentProfileUseCase,
  GetParentStudentDetailUseCase,
  UnlinkParentStudentUseCase,
]

@Module({
  imports: [InfrastructureModule, AuthApplicationModule, StudentProfileApplicationModule],
  providers: PARENT_PROFILE_USE_CASES,
  exports: PARENT_PROFILE_USE_CASES,
})
export class ParentProfileApplicationModule {}
