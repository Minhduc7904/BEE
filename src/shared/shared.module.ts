// src/shared/shared.module.ts
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import { AuthGuard } from './guards/auth.guard'
import { RolesGuard } from './guards/roles.guard'
import { AuthApplicationModule } from '../application/use-cases/auth/auth.application.module'

/**
 * SharedModule
 * 
 * Module chứa shared resources: guards, pipes, filters, decorators.
 * 
 * ✅ Clean Architecture compliant:
 * - Import và RE-EXPORT AuthApplicationModule để có VerifyAccessTokenUseCase
 * - KHÔNG import InfrastructureModule (tránh vi phạm Dependency Rule)
 * - Guards inject UseCase từ Application layer
 * 
 * @layer Shared (Presentation)
 */
@Module({
  imports: [
    AuthApplicationModule, // ✅ Để có VerifyAccessTokenUseCase cho AuthGuard
    JwtModule.register({}), // Cần cho một số utility functions
  ],
  providers: [AuthGuard, RolesGuard],
  exports: [
    AuthGuard, 
    RolesGuard,
    AuthApplicationModule, // ✅ RE-EXPORT để PresentationModule có access to UseCase
  ],
})
export class SharedModule {}
