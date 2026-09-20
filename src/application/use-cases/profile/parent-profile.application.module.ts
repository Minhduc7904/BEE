import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { AuthApplicationModule } from '../auth/auth.application.module'
import { GetParentProfileUseCase } from './get-parent-profile.use-case'

@Module({
  imports: [InfrastructureModule, AuthApplicationModule],
  providers: [GetParentProfileUseCase],
  exports: [GetParentProfileUseCase],
})
export class ParentProfileApplicationModule {}
