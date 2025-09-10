// src/infrastructure/infrastructure.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaUnitOfWork } from './repositories/prisma-unit-of-work.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaRoleRepository } from './repositories/prisma-role.repository';
import { PrismaStudentRepository } from './repositories/prisma-student.repository';
import { PrismaEmailVerificationTokenRepository } from './repositories/prisma-email-verification-token.repository';
import { PasswordService } from './services/password.service';
import { JwtTokenService } from './services/jwt.service';
import { TokenHashService } from './services/token-hash.service';
import { EmailVerificationTokenService } from './services/email-verification-token.service';
import { HttpClientService } from './services/http-client.service';
import { AuthService } from './services/auth.service';
import { ResendEmailService } from './services/resend-email.service';
import { GoogleAdminStrategy } from './strategies/google-admin.strategy';
import { GoogleStudentStrategy } from './strategies/google-student.strategy';
import jwtConfig from '../config/jwt.config';
import googleOAuthConfig from '../config/google-oauth.config';
import emailConfig from '../config/email.config';
import httpClientConfig from '../config/http-client.config';

@Module({
    imports: [
        PrismaModule,
        ConfigModule.forFeature(jwtConfig),
        ConfigModule.forFeature(googleOAuthConfig),
        ConfigModule.forFeature(emailConfig),
        ConfigModule.forFeature(httpClientConfig),
        JwtModule.register({}), // Empty config, sẽ override trong service
    ],
    providers: [
        {
            provide: 'UNIT_OF_WORK',
            useClass: PrismaUnitOfWork,
        },
        {
            provide: 'IUserRepository',
            useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
            inject: [PrismaService],
        },
        {
            provide: 'IRoleRepository',
            useFactory: (prisma: PrismaService) => new PrismaRoleRepository(prisma),
            inject: [PrismaService],
        },
        {
            provide: 'IStudentRepository',
            useFactory: (prisma: PrismaService) => new PrismaStudentRepository(prisma),
            inject: [PrismaService],
        },
        {
            provide: 'IEmailVerificationTokenRepository',
            useFactory: (prisma: PrismaService) => new PrismaEmailVerificationTokenRepository(prisma),
            inject: [PrismaService],
        },
        {
            provide: 'PASSWORD_SERVICE',
            useClass: PasswordService,
        },
        {
            provide: 'JWT_TOKEN_SERVICE',
            useClass: JwtTokenService,
        },
        {
            provide: 'TOKEN_HASH_SERVICE',
            useClass: TokenHashService,
        },
        EmailVerificationTokenService,
        {
            provide: 'HTTP_CLIENT_SERVICE',
            useClass: HttpClientService,
        },
        {
            provide: 'AUTH_SERVICE',
            useClass: AuthService,
        },
        {
            provide: 'IEmailService',
            useClass: ResendEmailService,
        },
        GoogleAdminStrategy,
        GoogleStudentStrategy,
    ],
    exports: [
        'UNIT_OF_WORK',
        'IUserRepository',
        'IRoleRepository',
        'IStudentRepository',
        'IEmailVerificationTokenRepository',
        'PASSWORD_SERVICE',
        'JWT_TOKEN_SERVICE',
        'TOKEN_HASH_SERVICE',
        EmailVerificationTokenService,
        'HTTP_CLIENT_SERVICE',
        'AUTH_SERVICE',
        'IEmailService',
    ],
})
export class InfrastructureModule { }
