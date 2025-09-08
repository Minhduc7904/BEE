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
import { PasswordService } from './services/password.service';
import { JwtTokenService } from './services/jwt.service';
import { TokenHashService } from './services/token-hash.service';
import { HttpClientService } from './services/http-client.service';
import { AuthService } from './services/auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import jwtConfig from '../config/jwt.config';
import googleOAuthConfig from '../config/google-oauth.config';

@Module({
    imports: [
        PrismaModule,
        ConfigModule.forFeature(jwtConfig),
        ConfigModule.forFeature(googleOAuthConfig),
        JwtModule.register({}), // Empty config, sẽ override trong service
    ],
    providers: [
        {
            provide: 'UNIT_OF_WORK',
            useClass: PrismaUnitOfWork,
        },
        {
            provide: 'USER_REPOSITORY',
            useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
            inject: [PrismaService],
        },
        {
            provide: 'ROLE_REPOSITORY',
            useFactory: (prisma: PrismaService) => new PrismaRoleRepository(prisma),
            inject: [PrismaService],
        },
        {
            provide: 'STUDENT_REPOSITORY',
            useFactory: (prisma: PrismaService) => new PrismaStudentRepository(prisma),
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
        {
            provide: 'HTTP_CLIENT_SERVICE',
            useClass: HttpClientService,
        },
        {
            provide: 'AUTH_SERVICE',
            useClass: AuthService,
        },
        GoogleStrategy,
    ],
    exports: [
        'UNIT_OF_WORK',
        'USER_REPOSITORY',
        'ROLE_REPOSITORY',
        'STUDENT_REPOSITORY',
        'PASSWORD_SERVICE',
        'JWT_TOKEN_SERVICE',
        'TOKEN_HASH_SERVICE',
        'HTTP_CLIENT_SERVICE',
        'AUTH_SERVICE',
    ],
})
export class InfrastructureModule { }
