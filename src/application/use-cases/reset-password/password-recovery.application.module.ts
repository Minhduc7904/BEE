import { Module } from '@nestjs/common'

import * as passwordRecoveryUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const PASSWORD_RECOVERY_USE_CASES = [
  passwordRecoveryUseCase.ResetPasswordUseCase,
  passwordRecoveryUseCase.SendResetPasswordEmailUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: PASSWORD_RECOVERY_USE_CASES,
  exports: PASSWORD_RECOVERY_USE_CASES,
})
export class PasswordRecoveryApplicationModule {}
