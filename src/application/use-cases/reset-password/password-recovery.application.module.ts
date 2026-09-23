import { Module } from '@nestjs/common'

import * as passwordRecoveryUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { AuthApplicationModule } from '../auth/auth.application.module'

const PASSWORD_RECOVERY_USE_CASES = [
  passwordRecoveryUseCase.ResetPasswordUseCase,
  passwordRecoveryUseCase.SendResetPasswordEmailUseCase,
  passwordRecoveryUseCase.GetParentRecoveryStudentsUseCase,
  passwordRecoveryUseCase.VerifyParentRecoveryUseCase,
  passwordRecoveryUseCase.ResetParentPasswordUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
    AuthApplicationModule, // 🔥 BẮT BUỘC - ParentStudentSummaryService (avatar lookup dùng chung)
  ],
  providers: PASSWORD_RECOVERY_USE_CASES,
  exports: PASSWORD_RECOVERY_USE_CASES,
})
export class PasswordRecoveryApplicationModule {}
