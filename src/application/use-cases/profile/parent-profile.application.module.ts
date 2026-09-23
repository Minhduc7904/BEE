import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { AuthApplicationModule } from '../auth/auth.application.module'
import { GetAvailableParentStudentsUseCase } from './get-available-parent-students.use-case'
import { GetParentProfileUseCase } from './get-parent-profile.use-case'
import { LinkParentStudentUseCase } from './link-parent-student.use-case'

@Module({
  imports: [InfrastructureModule, AuthApplicationModule],
  providers: [GetParentProfileUseCase, GetAvailableParentStudentsUseCase, LinkParentStudentUseCase],
  exports: [GetParentProfileUseCase, GetAvailableParentStudentsUseCase, LinkParentStudentUseCase],
})
export class ParentProfileApplicationModule {}
