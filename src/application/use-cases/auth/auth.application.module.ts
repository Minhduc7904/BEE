// auth.application.module.ts
import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import * as authUseCase from './'

const AUTH_USE_CASES = [
  authUseCase.LogoutUseCase,
  authUseCase.RefreshTokenUseCase,
  authUseCase.VerifyAccessTokenUseCase, // 🔐 For AuthGuard

  authUseCase.LoginAdminUseCase,
  authUseCase.RegisterAdminUseCase,
  authUseCase.GoogleOAuthAdminUseCase,

  authUseCase.LoginStudentUseCase,
  authUseCase.RegisterStudentUseCase,
  authUseCase.GoogleOAuthStudentUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: AUTH_USE_CASES,
  exports: AUTH_USE_CASES,
})
export class AuthApplicationModule {}
