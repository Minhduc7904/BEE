import { Module } from '@nestjs/common'

import * as adminUseCases from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const ADMIN_USE_CASES = [
  adminUseCases.GetAdminByIdUseCase,
  adminUseCases.UpdateAdminUseCase,
  adminUseCases.GetAllAdminUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: ADMIN_USE_CASES,
  exports: ADMIN_USE_CASES,
})
export class AdminApplicationModule {}
