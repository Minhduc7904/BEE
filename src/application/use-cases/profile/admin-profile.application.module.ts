import { Module } from '@nestjs/common'

import * as adminProfileUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const ADMIN_PROFILE_USE_CASES = [
  adminProfileUseCase.GetAdminProfileUseCase,
  adminProfileUseCase.UpdateAdminProfileUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: ADMIN_PROFILE_USE_CASES,
  exports: ADMIN_PROFILE_USE_CASES,
})
export class AdminProfileApplicationModule {}
