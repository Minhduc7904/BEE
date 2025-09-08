// src/application/application.module.ts
import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { RegisterAdminUseCase } from './use-cases/auth/register-admin.use-case';
import { RegisterStudentUseCase } from './use-cases/auth/register-student.use-case';
import { LoginAdminUseCase } from './use-cases/auth/login-admin.use-case';
import { LoginStudentUseCase } from './use-cases/auth/login-student.use-case';
import { RefreshTokenUseCase } from './use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from './use-cases/auth/logout.use-case';
import { CreateDocumentUseCase } from './use-cases/document/create-document.use-case';
import { CreateQuestionImageUseCase } from './use-cases/image/create-question-image.use-case';
import { CreateSolutionImageUseCase } from './use-cases/image/create-solution-image.use-case';
import { CreateMediaImageUseCase } from './use-cases/image/create-media-image.use-case';
import { CreateImageUseCase } from './use-cases/image/create-image.use-case';
import { CreateRoleUseCase } from './use-cases/role/create-role.use-case';
import { RollbackUseCase } from './use-cases/log/roll-back.use-case';
import { GetAllStudentUseCase } from './use-cases/student/get-all-student.use-case';

@Module({
    imports: [InfrastructureModule],
    providers: [
        RegisterAdminUseCase,
        RegisterStudentUseCase,
        LoginAdminUseCase,
        LoginStudentUseCase,
        RefreshTokenUseCase,
        LogoutUseCase,
        CreateDocumentUseCase,
        CreateQuestionImageUseCase,
        CreateSolutionImageUseCase,
        CreateMediaImageUseCase,
        CreateImageUseCase,
        CreateRoleUseCase,
        RollbackUseCase,
        GetAllStudentUseCase,
    ],
    exports: [
        RegisterAdminUseCase,
        RegisterStudentUseCase,
        LoginAdminUseCase,
        LoginStudentUseCase,
        RefreshTokenUseCase,
        LogoutUseCase,
        CreateDocumentUseCase,
        CreateQuestionImageUseCase,
        CreateSolutionImageUseCase,
        CreateMediaImageUseCase,
        CreateImageUseCase,
        CreateRoleUseCase,
        RollbackUseCase,
        GetAllStudentUseCase,
    ],
})
export class ApplicationModule {}
