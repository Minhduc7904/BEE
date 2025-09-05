// src/presentation/presentation.module.ts
import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { AuthController } from './controllers/auth.controller';
import { ResourceController } from './controllers/resource.controller';
import { RoleController } from './controllers/role.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [ApplicationModule, InfrastructureModule, SharedModule],
    controllers: [AuthController, ResourceController, RoleController],
})
export class PresentationModule { }
