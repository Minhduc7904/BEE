// src/application/application.module.ts
import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { RegisterAdminUseCase } from './use-cases/auth/admin/register-admin.use-case';
import { RegisterStudentUseCase } from './use-cases/auth/student/register-student.use-case';
import { LoginAdminUseCase } from './use-cases/auth/admin/login-admin.use-case';
import { LoginStudentUseCase } from './use-cases/auth/student/login-student.use-case';
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
import { UpdateStudentUseCase } from './use-cases/student/update-student.use-case';
import { UpdateAdminUseCase } from './use-cases/admin/update-admin.use-case';
import { UpdateUserUseCase } from './use-cases/user/update-user.use-case';
import { GoogleOAuthAdminUseCase } from './use-cases/auth/admin/google-oauth-admin.use-case';
import { GoogleOAuthStudentUseCase } from './use-cases/auth/student/google-oauth-student.use-case';
import { SendVerificationEmailUseCase } from './use-cases/email-verification/send-verification-email.use-case';
import { VerifyEmailUseCase } from './use-cases/email-verification/verify-email.use-case';
import { FetchStudentFromApiUseCase } from './use-cases/student/fetch-student-from-api.use-case';

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
        UpdateStudentUseCase,
        UpdateAdminUseCase,
        UpdateUserUseCase,
        GoogleOAuthAdminUseCase,
        GoogleOAuthStudentUseCase,
        SendVerificationEmailUseCase,
        VerifyEmailUseCase,
        FetchStudentFromApiUseCase,
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
        UpdateStudentUseCase,
        UpdateAdminUseCase,
        UpdateUserUseCase,
        GoogleOAuthAdminUseCase,
        GoogleOAuthStudentUseCase,
        SendVerificationEmailUseCase,
        VerifyEmailUseCase,
        FetchStudentFromApiUseCase,
    ],
})
export class ApplicationModule { }
