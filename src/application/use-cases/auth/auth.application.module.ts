// auth.application.module.ts
import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { SocketModule } from '../../../infrastructure/socket.module'
import { AllowParentRegistrationUseCase } from '../admin/allow-parent-registration.use-case'
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

  authUseCase.CheckParentPhoneUseCase,
  authUseCase.RegisterParentUseCase,
  authUseCase.LoginParentUseCase,
  authUseCase.ParentStudentSummaryService,
  authUseCase.ParentAccountDeletionService,
  authUseCase.DeleteParentAccountUseCase,
  authUseCase.DeleteParentAccountPublicUseCase,
  AllowParentRegistrationUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
    SocketModule,
  ],
  providers: AUTH_USE_CASES,
  exports: AUTH_USE_CASES,
})
export class AuthApplicationModule {}
