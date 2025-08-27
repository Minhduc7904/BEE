// src/application/application.module.ts
import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { RegisterAdminUseCase } from './use-cases/register-admin.use-case';
import { RegisterStudentUseCase } from './use-cases/register-student.use-case';
import { LoginAdminUseCase } from './use-cases/login-admin.use-case';
import { LoginStudentUseCase } from './use-cases/login-student.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';

@Module({
    imports: [InfrastructureModule],
    providers: [
        RegisterAdminUseCase,
        RegisterStudentUseCase,
        LoginAdminUseCase,
        LoginStudentUseCase,
        RefreshTokenUseCase,
        LogoutUseCase,
    ],
    exports: [
        RegisterAdminUseCase,
        RegisterStudentUseCase,
        LoginAdminUseCase,
        LoginStudentUseCase,
        RefreshTokenUseCase,
        LogoutUseCase,
    ],
})
export class ApplicationModule {}
