import { Module } from '@nestjs/common'

import * as userUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const USER_USE_CASES = [
  userUseCase.UpdateUserUseCase,
  userUseCase.UpdateUserAvatarUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: USER_USE_CASES,
  exports: USER_USE_CASES,
})
export class UserApplicationModule {}
