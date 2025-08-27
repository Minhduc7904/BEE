// src/infrastructure/infrastructure.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaUnitOfWork } from './repositories/prisma-unit-of-work.repository';
import { PasswordService } from './services/password.service';
import { JwtTokenService } from './services/jwt.service';
import { TokenHashService } from './services/token-hash.service';
import jwtConfig from '../config/jwt.config';

@Module({
    imports: [
        PrismaModule,
        ConfigModule.forFeature(jwtConfig),
        JwtModule.register({}), // Empty config, sẽ override trong service
    ],
    providers: [
        {
            provide: 'UNIT_OF_WORK',
            useClass: PrismaUnitOfWork,
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
    ],
    exports: [
        'UNIT_OF_WORK',
        'PASSWORD_SERVICE',
        'JWT_TOKEN_SERVICE',
        'TOKEN_HASH_SERVICE',
    ],
})
export class InfrastructureModule {}
