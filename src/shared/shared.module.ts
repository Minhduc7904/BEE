// src/shared/shared.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
    imports: [
        InfrastructureModule, // Để có AUTH_SERVICE
        JwtModule.register({}), // Cần cho AuthGuard
    ],
    providers: [
        AuthGuard,
        RolesGuard,
    ],
    exports: [
        AuthGuard,
        RolesGuard,
    ],
})
export class SharedModule { }
