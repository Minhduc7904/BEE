import { Module } from '@nestjs/common'

import * as emailVerificationUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const EMAIL_VERIFICATION_USE_CASES = [
  emailVerificationUseCase.SendVerificationEmailUseCase,
  emailVerificationUseCase.VerifyEmailUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: EMAIL_VERIFICATION_USE_CASES,
  exports: EMAIL_VERIFICATION_USE_CASES,
})
export class EmailVerificationApplicationModule {}
